using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using DentalVision.Domain.Enums;

namespace DentalVision.Domain.Entities
{
    public class PlaqueAnalysis
    {
        public int Id { get; set; }
        public int ImageId { get; set; } // 1:1 with DentalImage

        [Column("PlaquePercentage")]
        public decimal CoveragePercentage { get; set; }
        public decimal ConfidenceScore { get; set; }

        [Column("AnalysisStatus")]
        public AnalysisStatus Status { get; set; } = AnalysisStatus.PendingValidation;
        public string? DetectedRegions { get; set; } // JSON array of coordinate bounding boxes
        public string? OverlayImagePath { get; set; }

        [Column("ProcessedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? ApprovedByDentistId { get; set; }
        public DateTime? ApprovedAt { get; set; }

        // Navigation properties
        public virtual DentalImage DentalImage { get; set; } = null!;
        public virtual Dentist? ApprovedByDentist { get; set; }
        public virtual ICollection<PlaqueMapping> PlaqueMappings { get; set; } = new List<PlaqueMapping>();
        public virtual ClinicalReport? ClinicalReport { get; set; }
    }
}
