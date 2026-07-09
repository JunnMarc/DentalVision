using System;

namespace DentalVision.Domain.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string LogType { get; set; } = "System"; // "System" or "Security"
        public string TableName { get; set; } = string.Empty;
        public int? RecordId { get; set; }
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? IpAddress { get; set; }

        // Navigation properties
        public virtual User? User { get; set; }
    }
}
