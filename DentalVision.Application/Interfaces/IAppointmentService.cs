using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DentalVision.Application.DTOs;

namespace DentalVision.Application.Interfaces
{
    public interface IAppointmentService
    {
        Task<AppointmentDto?> GetByIdAsync(int id);
        Task<IEnumerable<AppointmentDto>> GetAllAsync(DateTime? date = null);
        Task<IEnumerable<AppointmentDto>> GetByPatientIdAsync(int patientId);
        Task<AppointmentDto> CreateAsync(CreateAppointmentDto request);
        Task<AppointmentDto> QuickBookAsync(QuickBookAppointmentDto request);
        Task<AppointmentDto?> UpdateStatusAsync(int id, UpdateAppointmentStatusDto request);
        Task<AppointmentDto?> UpdateIntakeAsync(int id, UpdateAppointmentIntakeDto request);
    }
}
