using System;

namespace DentalVision.Application.DTOs
{
    public class ToothStatusDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public int ToothNumber { get; set; }
        public string Status { get; set; } = "Healthy";
        public string? Notes { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateToothStatusDto
    {
        public int ToothNumber { get; set; }
        public string Status { get; set; } = "Healthy";
        public string? Notes { get; set; }
    }
}
