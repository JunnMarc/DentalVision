using System;

namespace DentalVision.Domain.Entities
{
    public class Tenant
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // SaaS custom properties
        public string SubscriptionTier { get; set; } = "Basic"; // "Basic", "Professional", "Enterprise"
        public int MaxUsers { get; set; } = 5;
        public int MaxPlaqueAnalysesPerMonth { get; set; } = 50;
        public bool EnableBilling { get; set; } = true;
        public bool EnableReports { get; set; } = true;
        public string ThemeColor { get; set; } = "#14B8A6";
    }
}
