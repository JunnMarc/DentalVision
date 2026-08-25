using System;
using System.Threading.Tasks;
using AutoMapper;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;
using DentalVision.Application.Interfaces.Security;
using DentalVision.Application.Common;
using DentalVision.Domain.Entities;
using DentalVision.Domain.Enums;
using DentalVision.Domain.Interfaces;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace DentalVision.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtProvider _jwtProvider;
        private readonly IMapper _mapper;
        private readonly ITenantProvider _tenantProvider;

        public AuthService(IUnitOfWork unitOfWork, IJwtProvider jwtProvider, IMapper mapper, ITenantProvider tenantProvider)
        {
            _unitOfWork = unitOfWork;
            _jwtProvider = jwtProvider;
            _mapper = mapper;
            _tenantProvider = tenantProvider;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
        {
            var user = _unitOfWork.Users.Find(u => u.Email == request.Email && u.IsActive).IgnoreQueryFilters().FirstOrDefault();
            if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                var failLog = new AuditLog
                {
                    LogType = "Security",
                    Action = "LOGIN_FAILED",
                    TableName = "Users",
                    NewValues = System.Text.Json.JsonSerializer.Serialize(new { Email = request.Email }),
                    Timestamp = DateTime.UtcNow
                };
                await _unitOfWork.AuditLogs.AddAsync(failLog);
                await _unitOfWork.CompleteAsync();
                return null;
            }

            var token = _jwtProvider.GenerateToken(user);
            var userDto = _mapper.Map<UserDto>(user);
            await MapTenantPropertiesAsync(user, userDto);

            var successLog = new AuditLog
            {
                LogType = "Security",
                Action = "LOGIN_SUCCESS",
                TableName = "Users",
                UserId = user.Id,
                RecordId = user.Id,
                NewValues = System.Text.Json.JsonSerializer.Serialize(new { Email = user.Email, Role = user.Role.ToString() }),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(successLog);
            await _unitOfWork.CompleteAsync();

            return new LoginResponseDto
            {
                Token = token,
                User = userDto
            };
        }

        public async Task<UserDto> RegisterAsync(RegisterRequestDto request)
        {
            var existingUser = _unitOfWork.Users.Find(u => u.Email == request.Email).FirstOrDefault();
            if (existingUser != null)
            {
                throw new Exception("Email already registered");
            }

            // Quota limit validation
            if (request.Role != UserRole.Patient)
            {
                var currentTenantId = _tenantProvider.GetTenantId();
                if (currentTenantId.HasValue)
                {
                    var tenant = await _unitOfWork.Tenants.GetByIdAsync(currentTenantId.Value);
                    if (tenant != null && tenant.MaxUsers > 0)
                    {
                        var currentStaffCount = _unitOfWork.Users.Find(u => u.Role != UserRole.Patient && u.IsActive).Count();
                        if (currentStaffCount >= tenant.MaxUsers)
                        {
                            throw new Exception($"Staff account limit ({tenant.MaxUsers}) reached for your clinic's subscription plan.");
                        }
                    }
                }
            }

            var user = _mapper.Map<User>(request);
            user.PasswordHash = PasswordHasher.HashPassword(request.Password);

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.CompleteAsync(); // Save to get the generated User ID

            var regLog = new AuditLog
            {
                LogType = "Security",
                Action = "USER_REGISTERED",
                TableName = "Users",
                RecordId = user.Id,
                NewValues = System.Text.Json.JsonSerializer.Serialize(new { Email = user.Email, Role = user.Role.ToString() }),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(regLog);
            await _unitOfWork.CompleteAsync();

            if (request.Role == UserRole.Dentist)
            {
                var dentist = new Dentist
                {
                    Id = user.Id,
                    LicenseNumber = request.LicenseNumber ?? $"LIC-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
                    Specialization = request.Specialization ?? "General Dentistry"
                };
                await _unitOfWork.Dentists.AddAsync(dentist);
            }
            else if (request.Role == UserRole.Receptionist)
            {
                var receptionist = new Receptionist
                {
                    Id = user.Id,
                    EmployeeCode = request.EmployeeCode ?? $"EMP-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}"
                };
                await _unitOfWork.Receptionists.AddAsync(receptionist);
            }
            else if (request.Role == UserRole.Patient)
            {
                var patient = new Patient
                {
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    PatientCode = $"PAT-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}",
                    DateOfBirth = new DateTime(2000, 1, 1),
                    Phone = "0000000000"
                };
                await _unitOfWork.Patients.AddAsync(patient);
            }

            await _unitOfWork.CompleteAsync();
            var userDto = _mapper.Map<UserDto>(user);
            await MapTenantPropertiesAsync(user, userDto);
            return userDto;
        }

        public async Task<UserDto> RegisterClinicAsync(RegisterClinicRequestDto request)
        {
            var existingTenant = _unitOfWork.Tenants.Find(t => t.Slug.ToLower() == request.ClinicSlug.ToLower()).FirstOrDefault();
            if (existingTenant != null)
            {
                throw new Exception("Clinic URL slug is already taken.");
            }

            var existingUser = _unitOfWork.Users.Find(u => u.Email == request.AdminEmail).FirstOrDefault();
            if (existingUser != null)
            {
                throw new Exception("Admin email is already registered.");
            }

            // 1. Create Tenant
            var tenant = new Tenant
            {
                Name = request.ClinicName,
                Slug = request.ClinicSlug,
                IsActive = true
            };
            await _unitOfWork.Tenants.AddAsync(tenant);
            await _unitOfWork.CompleteAsync(); // Save to generate tenant.Id

            // 2. Create Administrator User
            var adminUser = new User
            {
                TenantId = tenant.Id,
                Email = request.AdminEmail,
                FirstName = request.AdminFirstName,
                LastName = request.AdminLastName,
                PasswordHash = PasswordHasher.HashPassword(request.AdminPassword),
                Role = UserRole.Administrator,
                IsActive = true
            };

            await _unitOfWork.Users.AddAsync(adminUser);
            await _unitOfWork.CompleteAsync();

            // Seed default services for the new clinic
            var defaultServices = new[]
            {
                new Service { TenantId = tenant.Id, ServiceName = "Dental Consultation", Price = 75.00m, Description = "Comprehensive dental assessment and consult." },
                new Service { TenantId = tenant.Id, ServiceName = "Professional Scaling & Polishing", Price = 120.00m, Description = "Complete prophylaxis and scale cleaning." },
                new Service { TenantId = tenant.Id, ServiceName = "Composite Filling", Price = 150.00m, Description = "Composite resin dental restoration for caries." },
                new Service { TenantId = tenant.Id, ServiceName = "Dental X-Ray", Price = 50.00m, Description = "Intraoral X-Ray imaging check." }
            };
            foreach (var svc in defaultServices)
            {
                await _unitOfWork.Services.AddAsync(svc);
            }
            
            // Seed clinic settings
            await _unitOfWork.ClinicSettings.AddAsync(new ClinicSetting
            {
                TenantId = tenant.Id,
                SettingKey = "ClinicName",
                SettingValue = request.ClinicName,
                Description = "Name of the clinic displayed in reports"
            });
            await _unitOfWork.ClinicSettings.AddAsync(new ClinicSetting
            {
                TenantId = tenant.Id,
                SettingKey = "PlaqueThresholdHigh",
                SettingValue = "35.0",
                Description = "Percentage above which plaque accumulation is classified high"
            });
            await _unitOfWork.ClinicSettings.AddAsync(new ClinicSetting
            {
                TenantId = tenant.Id,
                SettingKey = "TaxRate",
                SettingValue = "0.05",
                Description = "Default tax rate applied to billing invoices"
            });

            await _unitOfWork.CompleteAsync();

            var regLog = new AuditLog
            {
                TenantId = tenant.Id,
                LogType = "Security",
                Action = "CLINIC_REGISTERED",
                TableName = "Tenants",
                RecordId = tenant.Id,
                NewValues = System.Text.Json.JsonSerializer.Serialize(new { ClinicName = tenant.Name, Slug = tenant.Slug, AdminEmail = adminUser.Email }),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(regLog);
            await _unitOfWork.CompleteAsync();

            var userDto = _mapper.Map<UserDto>(adminUser);
            await MapTenantPropertiesAsync(adminUser, userDto);
            return userDto;
        }

        private async Task MapTenantPropertiesAsync(User user, UserDto userDto)
        {
            var tenant = await _unitOfWork.Tenants.GetByIdAsync(user.TenantId);
            if (tenant != null)
            {
                userDto.SubscriptionTier = tenant.SubscriptionTier;
                userDto.MaxUsers = tenant.MaxUsers;
                userDto.MaxPlaqueAnalysesPerMonth = tenant.MaxPlaqueAnalysesPerMonth;
                userDto.EnableBilling = tenant.EnableBilling;
                userDto.EnableReports = tenant.EnableReports;
                userDto.ThemeColor = tenant.ThemeColor;
            }
        }
    }
}
