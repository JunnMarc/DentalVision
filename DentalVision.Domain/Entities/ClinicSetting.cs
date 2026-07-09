namespace DentalVision.Domain.Entities
{
    public class ClinicSetting
    {
        public int Id { get; set; }
        public string SettingKey { get; set; } = string.Empty;
        public string SettingValue { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
