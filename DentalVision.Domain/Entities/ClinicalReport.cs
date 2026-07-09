using System;

namespace DentalVision.Domain.Entities
{
    public class ClinicalReport
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public int DentistId { get; set; }
        public int AnalysisId { get; set; } // 1:1 with PlaqueAnalysis
        public DateTime ReportDate { get; set; } = DateTime.UtcNow;
        public string? DentistNotes { get; set; }
        public string? Recommendations { get; set; }
        public string ApprovalStatus { get; set; } = "Draft"; // Draft, Approved
        public string? PdfFilePath { get; set; }

        // Navigation properties
        public virtual Patient Patient { get; set; } = null!;
        public virtual Dentist Dentist { get; set; } = null!;
        public virtual PlaqueAnalysis PlaqueAnalysis { get; set; } = null!;
    }
}
