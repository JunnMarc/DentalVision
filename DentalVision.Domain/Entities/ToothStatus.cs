using System;

namespace DentalVision.Domain.Entities
{
    public class ToothStatus
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public int ToothNumber { get; set; }
        public string Status { get; set; } = "Healthy"; // Healthy, Caries, Restored, Missing, BridgeCrown
        public string? Notes { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual Patient Patient { get; set; } = null!;
    }
}
