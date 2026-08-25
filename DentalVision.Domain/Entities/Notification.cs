using System;

namespace DentalVision.Domain.Entities
{
    public class Notification : ITenantEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual User User { get; set; } = null!;
    }
}
