using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using DentalVision.Infrastructure.Persistence;
using System.Linq;

namespace DentalVision.API.Middleware
{
    public class MultiTenantMiddleware
    {
        private readonly RequestDelegate _next;

        public MultiTenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            string? tenantSlug = null;
            if (context.Request.Headers.TryGetValue("X-Tenant-Slug", out var headerValues))
            {
                tenantSlug = headerValues.FirstOrDefault();
            }

            var path = context.Request.Path.Value?.ToLower();
            if (string.IsNullOrEmpty(tenantSlug) && path != null && 
                (path.Contains("/auth/login") || path.Contains("/auth/register") || path.Contains("/auth/register-clinic")))
            {
                tenantSlug = "default";
            }

            if (!string.IsNullOrEmpty(tenantSlug))
            {
                // Resolve DbContext to look up Tenant details without causing circular injection in scoped services
                var dbContext = context.RequestServices.GetRequiredService<DentalVisionDbContext>();
                var tenant = await dbContext.Tenants
                    .FirstOrDefaultAsync(t => t.Slug.ToLower() == tenantSlug.ToLower());

                if (tenant != null)
                {
                    if (!tenant.IsActive)
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsync("The requested dental clinic is suspended.");
                        return;
                    }

                    context.Items["TenantId"] = tenant.Id;
                    context.Items["TenantSlug"] = tenant.Slug;
                }
                else
                {
                    if (tenantSlug != "default")
                    {
                        context.Response.StatusCode = StatusCodes.Status404NotFound;
                        await context.Response.WriteAsync($"Dental clinic '{tenantSlug}' not found.");
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}
