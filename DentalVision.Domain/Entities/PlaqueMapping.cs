using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace DentalVision.Domain.Entities
{
    public class PlaqueMapping : ITenantEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int AnalysisId { get; set; }
        public int ToothNumber { get; set; }
        public string PlaqueLevel { get; set; } = "Low"; // Low, Medium, High
        public string GumlineRegion { get; set; } = "Cervical"; // Cervical, Interproximal, Margin

        [Column("RegionData")]
        public string CoordinatesJson { get; set; } = "[]"; // Serialized nodes/points for overlay drawing

        public string? GumlineMapPath { get; set; }
        public bool DentistValidated { get; set; } = false;
        public DateTime? ValidatedAt { get; set; }
        public int? DentistId { get; set; }

        // Navigation properties
        public virtual PlaqueAnalysis PlaqueAnalysis { get; set; } = null!;
        public virtual Dentist? Dentist { get; set; }
    }
}
