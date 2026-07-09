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

namespace DentalVision.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtProvider _jwtProvider;
        private readonly IMapper _mapper;

        public AuthService(IUnitOfWork unitOfWork, IJwtProvider jwtProvider, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _jwtProvider = jwtProvider;
            _mapper = mapper;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
        {
            var user = _unitOfWork.Users.Find(u => u.Email == request.Email && u.IsActive).FirstOrDefault();
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

            await _unitOfWork.CompleteAsync();
            return _mapper.Map<UserDto>(user);
        }
    }
}
