using System;

namespace DentalVision.Domain.Entities
{
    public class DentalImage
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public int UploadedByUserId { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }

        // Navigation properties
        public virtual Patient Patient { get; set; } = null!;
        public virtual User UploadedByUser { get; set; } = null!;
        public virtual PlaqueAnalysis? PlaqueAnalysis { get; set; }
    }
}
