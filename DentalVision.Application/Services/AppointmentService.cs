using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;
using DentalVision.Domain.Entities;
using DentalVision.Domain.Enums;
using DentalVision.Domain.Interfaces;

namespace DentalVision.Application.Services
{
    public class AppointmentService : IAppointmentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AppointmentService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<AppointmentDto?> GetByIdAsync(int id)
        {
            var appointment = _unitOfWork.Appointments.Find(a => a.Id == id)
                .Include(a => a.Patient)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .FirstOrDefault();
            return _mapper.Map<AppointmentDto>(appointment);
        }

        public async Task<IEnumerable<AppointmentDto>> GetAllAsync(DateTime? date = null)
        {
            IQueryable<Appointment> query = _unitOfWork.Appointments.Find(a => true)
                .Include(a => a.Patient)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User);

            if (date.HasValue)
            {
                var startDate = date.Value.Date;
                var endDate = startDate.AddDays(1);
                query = query.Where(a => a.AppointmentDate >= startDate && a.AppointmentDate < endDate);
            }

            var appointments = query.ToList();
            return _mapper.Map<IEnumerable<AppointmentDto>>(appointments);
        }

        public async Task<IEnumerable<AppointmentDto>> GetByPatientIdAsync(int patientId)
        {
            var appointments = _unitOfWork.Appointments.Find(a => a.PatientId == patientId)
                .Include(a => a.Patient)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .OrderByDescending(a => a.AppointmentDate)
                .ToList();
            return _mapper.Map<IEnumerable<AppointmentDto>>(appointments);
        }

        public async Task<AppointmentDto> CreateAsync(CreateAppointmentDto request)
        {
            // Validate or resolve dentist ID
            var targetDentistId = request.DentistId;
            var dentistExists = _unitOfWork.Dentists.Find(d => d.Id == targetDentistId).Any();
            if (!dentistExists)
            {
                var fallbackDentist = _unitOfWork.Dentists.Find(d => d.User.IsActive).FirstOrDefault();
                if (fallbackDentist != null)
                {
                    targetDentistId = fallbackDentist.Id;
                }
            }

            var appointment = _mapper.Map<Appointment>(request);
            appointment.DentistId = targetDentistId;
            appointment.Status = request.Status ?? AppointmentStatus.Scheduled;

            await _unitOfWork.Appointments.AddAsync(appointment);
            await _unitOfWork.CompleteAsync();

            // Reload with navigations
            var created = _unitOfWork.Appointments.Find(a => a.Id == appointment.Id)
                .Include(a => a.Patient)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .FirstOrDefault();

            return created != null 
                ? _mapper.Map<AppointmentDto>(created) 
                : _mapper.Map<AppointmentDto>(appointment);
        }

        public async Task<AppointmentDto> QuickBookAsync(QuickBookAppointmentDto request)
        {
            int patientId;

            if (request.ExistingPatientId.HasValue && request.ExistingPatientId.Value > 0)
            {
                patientId = request.ExistingPatientId.Value;
            }
            else
            {
                // Create quick patient record
                var newPatient = new Patient
                {
                    FirstName = request.FirstName?.Trim() ?? "New",
                    LastName = request.LastName?.Trim() ?? "Patient",
                    Phone = request.Phone?.Trim() ?? string.Empty,
                    Email = request.Email?.Trim(),
                    PatientCode = $"PAT-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}",
                    IsProfileCompleted = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Patients.AddAsync(newPatient);
                await _unitOfWork.CompleteAsync();
                patientId = newPatient.Id;
            }

            // Validate or resolve dentist ID
            var targetDentistId = request.DentistId;
            var dentistExists = _unitOfWork.Dentists.Find(d => d.Id == targetDentistId).Any();
            if (!dentistExists)
            {
                var fallbackDentist = _unitOfWork.Dentists.Find(d => d.User.IsActive).FirstOrDefault();
                if (fallbackDentist != null)
                {
                    targetDentistId = fallbackDentist.Id;
                }
            }

            var appointment = new Appointment
            {
                PatientId = patientId,
                DentistId = targetDentistId,
                AppointmentDate = request.AppointmentDate,
                Reason = request.Reason,
                Notes = request.Notes,
                Status = AppointmentStatus.Scheduled,
                IsIntakeCompleted = false,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Appointments.AddAsync(appointment);
            await _unitOfWork.CompleteAsync();

            var created = _unitOfWork.Appointments.Find(a => a.Id == appointment.Id)
                .Include(a => a.Patient)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .FirstOrDefault();

            return created != null 
                ? _mapper.Map<AppointmentDto>(created) 
                : _mapper.Map<AppointmentDto>(appointment);
        }

        public async Task<AppointmentDto?> UpdateStatusAsync(int id, UpdateAppointmentStatusDto request)
        {
            var appointment = _unitOfWork.Appointments.Find(a => a.Id == id)
                .Include(a => a.Patient)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .FirstOrDefault();
            if (appointment == null) return null;

            appointment.Status = request.Status;
            if (request.Notes != null)
            {
                appointment.Notes = request.Notes;
            }

            _unitOfWork.Appointments.Update(appointment);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<AppointmentDto>(appointment);
        }

        public async Task<AppointmentDto?> UpdateIntakeAsync(int id, UpdateAppointmentIntakeDto request)
        {
            var appointment = _unitOfWork.Appointments.Find(a => a.Id == id)
                .Include(a => a.Patient)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .FirstOrDefault();
            if (appointment == null) return null;

            appointment.IsIntakeCompleted = request.IsIntakeCompleted;
            if (!string.IsNullOrWhiteSpace(request.IntakeNotes))
            {
                appointment.IntakeNotes = request.IntakeNotes;
            }

            _unitOfWork.Appointments.Update(appointment);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<AppointmentDto>(appointment);
        }
    }
}
