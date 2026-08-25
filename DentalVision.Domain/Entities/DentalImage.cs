using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace DentalVision.Domain.Entities
{
    public class DentalImage : ITenantEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int PatientId { get; set; }
        public int? AppointmentId { get; set; }

        [Column("UploadedBy")]
        public int UploadedByUserId { get; set; }

        [Column("ImagePath")]
        public string FilePath { get; set; } = string.Empty;
        public string? ImageType { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }

        // Navigation properties
        public virtual Patient Patient { get; set; } = null!;
        public virtual User UploadedByUser { get; set; } = null!;
        public virtual PlaqueAnalysis? PlaqueAnalysis { get; set; }
        public virtual Appointment? Appointment { get; set; }
    }
}
