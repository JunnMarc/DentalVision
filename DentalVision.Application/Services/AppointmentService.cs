using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
            var appointment = _unitOfWork.Appointments.Find(a => a.Id == id).FirstOrDefault();
            return _mapper.Map<AppointmentDto>(appointment);
        }

        public async Task<IEnumerable<AppointmentDto>> GetAllAsync(DateTime? date = null)
        {
            IQueryable<Appointment> query = _unitOfWork.Appointments.Find(a => true);

            if (date.HasValue)
            {
                var startDate = date.Value.Date;
                var endDate = startDate.AddDays(1);
                query = query.Where(a => a.AppointmentDate >= startDate && a.AppointmentDate < endDate);
            }

            var appointments = query.ToList();
            return _mapper.Map<IEnumerable<AppointmentDto>>(appointments);
        }

        public async Task<AppointmentDto> CreateAsync(CreateAppointmentDto request)
        {
            var appointment = _mapper.Map<Appointment>(request);
            appointment.Status = AppointmentStatus.Scheduled;

            await _unitOfWork.Appointments.AddAsync(appointment);
            await _unitOfWork.CompleteAsync();

            // Reload to fetch patient and dentist names
            var created = _unitOfWork.Appointments.Find(a => a.Id == appointment.Id).First();
            return _mapper.Map<AppointmentDto>(created);
        }

        public async Task<AppointmentDto?> UpdateStatusAsync(int id, UpdateAppointmentStatusDto request)
        {
            var appointment = _unitOfWork.Appointments.Find(a => a.Id == id).FirstOrDefault();
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
    }
}
