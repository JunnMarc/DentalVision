using System;
using System.Collections.Generic;

namespace DentalVision.Domain.Entities
{
    public class Patient
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? MedicalHistory { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public virtual ICollection<DentalImage> DentalImages { get; set; } = new List<DentalImage>();
        public virtual ICollection<ClinicalReport> ClinicalReports { get; set; } = new List<ClinicalReport>();
    }
}
