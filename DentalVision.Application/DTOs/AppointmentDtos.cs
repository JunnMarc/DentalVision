using System;
using DentalVision.Domain.Enums;

namespace DentalVision.Application.DTOs
{
    public class AppointmentDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string PatientPhone { get; set; } = string.Empty;
        public int DentistId { get; set; }
        public string DentistName { get; set; } = string.Empty;
        public DateTime AppointmentDate { get; set; }
        public AppointmentStatus Status { get; set; }
        public string? Reason { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateAppointmentDto
    {
        public int PatientId { get; set; }
        public int DentistId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string? Reason { get; set; }
        public string? Notes { get; set; }
        public AppointmentStatus? Status { get; set; }
    }

    public class UpdateAppointmentStatusDto
    {
        public AppointmentStatus Status { get; set; }
        public string? Notes { get; set; }
    }
}
