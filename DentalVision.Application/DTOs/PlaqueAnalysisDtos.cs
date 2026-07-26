using System;
using System.Collections.Generic;
using DentalVision.Domain.Enums;

namespace DentalVision.Application.DTOs
{
    public class DentalImageDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public int UploadedByUserId { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public string? Notes { get; set; }
    }

    public class PlaqueAnalysisDto
    {
        public int Id { get; set; }
        public int ImageId { get; set; }
        public decimal CoveragePercentage { get; set; }
        public decimal ConfidenceScore { get; set; }
        public AnalysisStatus Status { get; set; }
        public string? DetectedRegions { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? ApprovedByDentistId { get; set; }
        public string? ApprovedByDentistName { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string EngineUsed { get; set; } = "Unknown";
        public List<PlaqueMappingDto> Mappings { get; set; } = new List<PlaqueMappingDto>();
    }

    public class PlaqueMappingDto
    {
        public int Id { get; set; }
        public int ToothNumber { get; set; }
        public string PlaqueLevel { get; set; } = "Low";
        public string GumlineRegion { get; set; } = "Cervical";
        public string CoordinatesJson { get; set; } = "[]";
    }

    public class PlaqueAnalysisResultDto
    {
        public int ImageId { get; set; }
        public decimal CoveragePercentage { get; set; }
        public decimal ConfidenceScore { get; set; }
        public string DetectedRegions { get; set; } = string.Empty;
        public string EngineUsed { get; set; } = "Unknown";
        public List<PlaqueMappingDto> Mappings { get; set; } = new List<PlaqueMappingDto>();
    }

    public class ValidateAnalysisDto
    {
        public decimal ApprovedPercentage { get; set; }
        public string ApprovedRegions { get; set; } = string.Empty; // Updated JSON coordinates
        public List<PlaqueMappingDto> Mappings { get; set; } = new List<PlaqueMappingDto>();
        public string? DentistNotes { get; set; }
        public string? Recommendations { get; set; }
    }
}
