namespace DentalVision.Domain.Entities
{
    public class ClinicSetting : ITenantEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public string SettingKey { get; set; } = string.Empty;
        public string SettingValue { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
