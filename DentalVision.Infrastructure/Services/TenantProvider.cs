using System.Security.Claims;
using DentalVision.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace DentalVision.Infrastructure.Services
{
    public class TenantProvider : ITenantProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TenantProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? GetTenantId()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            // 1. Try to read from HttpContext.Items (populated by MultiTenantMiddleware)
            if (httpContext.Items.TryGetValue("TenantId", out var cachedId) && cachedId is int tenantId)
            {
                return tenantId;
            }

            // 2. Try to read from JWT User Claims
            var tenantIdClaim = httpContext.User?.FindFirst("TenantId")?.Value;
            if (int.TryParse(tenantIdClaim, out var claimTenantId))
            {
                httpContext.Items["TenantId"] = claimTenantId;
                return claimTenantId;
            }

            return null;
        }

        public string? GetTenantSlug()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            // 1. Try to read from HttpContext.Items (populated by MultiTenantMiddleware)
            if (httpContext.Items.TryGetValue("TenantSlug", out var cachedSlug) && cachedSlug is string slug)
            {
                return slug;
            }

            // 2. Try to read from JWT User Claims
            var slugClaim = httpContext.User?.FindFirst("TenantSlug")?.Value;
            if (!string.IsNullOrEmpty(slugClaim))
            {
                httpContext.Items["TenantSlug"] = slugClaim;
                return slugClaim;
            }

            // 3. Fallback to reading the header for anonymous requests
            if (httpContext.Request.Headers.TryGetValue("X-Tenant-Slug", out var headerSlug))
            {
                return headerSlug.ToString();
            }

            return null;
        }

        public bool IsSuperAdmin()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return false;

            var roleClaim = httpContext.User?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.IsNullOrEmpty(roleClaim))
            {
                if (roleClaim == "SuperAdministrator" || roleClaim == "5")
                {
                    return true;
                }
            }
            return false;
        }
    }
}
