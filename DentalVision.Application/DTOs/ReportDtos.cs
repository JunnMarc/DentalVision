using System;

namespace DentalVision.Application.DTOs
{
    public class ClinicalReportDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public DateTime PatientDOB { get; set; }
        public int DentistId { get; set; }
        public string DentistName { get; set; } = string.Empty;
        public int AnalysisId { get; set; }
        public decimal CoveragePercentage { get; set; }
        public DateTime ReportDate { get; set; }
        public string? DentistNotes { get; set; }
        public string? Recommendations { get; set; }
        public string ApprovalStatus { get; set; } = "Draft";
        public string? PdfFilePath { get; set; }
    }

    public class CreateClinicalReportDto
    {
        public int AnalysisId { get; set; }
        public string? DentistNotes { get; set; }
        public string? Recommendations { get; set; }
        public bool ApproveReport { get; set; } // If true, sets status to Approved
    }
}
