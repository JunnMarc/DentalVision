using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace DentalVision.Domain.Entities
{
    public class ClinicalReport : ITenantEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int PatientId { get; set; }
        public int DentistId { get; set; }
        public int AnalysisId { get; set; } // 1:1 with PlaqueAnalysis
        public int? AppointmentId { get; set; }

        [Column("CreatedAt")]
        public DateTime ReportDate { get; set; } = DateTime.UtcNow;

        [Column("Diagnosis")]
        public string? DentistNotes { get; set; }
        public string? Findings { get; set; }
        public string? Recommendations { get; set; }
        public string ApprovalStatus { get; set; } = "Draft"; // Draft, Approved

        [Column("PdfPath")]
        public string? PdfFilePath { get; set; }

        // Navigation properties
        public virtual Patient Patient { get; set; } = null!;
        public virtual Dentist Dentist { get; set; } = null!;
        public virtual PlaqueAnalysis PlaqueAnalysis { get; set; } = null!;
        public virtual Appointment? Appointment { get; set; }
    }
}
