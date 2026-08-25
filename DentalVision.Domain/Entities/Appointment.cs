using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using DentalVision.Domain.Enums;

namespace DentalVision.Domain.Entities
{
    public class Appointment : ITenantEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int PatientId { get; set; }
        public int DentistId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;

        [Column("Purpose")]
        public string? Reason { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Patient Patient { get; set; } = null!;
        public virtual Dentist Dentist { get; set; } = null!;
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}
