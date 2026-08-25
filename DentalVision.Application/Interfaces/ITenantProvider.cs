namespace DentalVision.Application.Interfaces
{
    public interface ITenantProvider
    {
        int? GetTenantId();
        string? GetTenantSlug();
        bool IsSuperAdmin();
    }
}
