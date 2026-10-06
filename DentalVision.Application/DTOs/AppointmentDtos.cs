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
        public string? PatientEmail { get; set; }
        public bool IsPatientProfileCompleted { get; set; }
        public int DentistId { get; set; }
        public string DentistName { get; set; } = string.Empty;
        public DateTime AppointmentDate { get; set; }
        public AppointmentStatus Status { get; set; }
        public string? Reason { get; set; }
        public string? Notes { get; set; }
        public bool IsIntakeCompleted { get; set; }
        public string? IntakeNotes { get; set; }
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

    public class QuickBookAppointmentDto
    {
        // Patient Selection / Quick Intake
        public int? ExistingPatientId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }

        // Appointment Details
        public int DentistId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string? Reason { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateAppointmentStatusDto
    {
        public AppointmentStatus Status { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateAppointmentIntakeDto
    {
        public bool IsIntakeCompleted { get; set; } = true;
        public string? IntakeNotes { get; set; }
    }
}
