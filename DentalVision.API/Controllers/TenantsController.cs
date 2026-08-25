using System.Threading.Tasks;
using DentalVision.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdministrator")]
    public class TenantsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public TenantsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleTenantStatus(int id)
        {
            var tenant = await _unitOfWork.Tenants.GetByIdAsync(id);
            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            // Prevent lock-out of primary system tenant
            if (tenant.Id == 1)
            {
                return BadRequest(new { message = "Cannot deactivate the central master tenant." });
            }

            tenant.IsActive = !tenant.IsActive;
            _unitOfWork.Tenants.Update(tenant);
            await _unitOfWork.CompleteAsync();

            return Ok(new { message = $"Tenant status updated to {(tenant.IsActive ? "Active" : "Suspended")}", isActive = tenant.IsActive });
        }

        [HttpPut("{id}/configuration")]
        public async Task<IActionResult> UpdateTenantConfiguration(int id, [FromBody] TenantConfigurationDto configDto)
        {
            if (configDto == null) return BadRequest("Configuration details cannot be null.");

            var tenant = await _unitOfWork.Tenants.GetByIdAsync(id);
            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            tenant.SubscriptionTier = configDto.SubscriptionTier;
            tenant.MaxUsers = configDto.MaxUsers;
            tenant.MaxPlaqueAnalysesPerMonth = configDto.MaxPlaqueAnalysesPerMonth;
            tenant.EnableBilling = configDto.EnableBilling;
            tenant.EnableReports = configDto.EnableReports;
            tenant.ThemeColor = configDto.ThemeColor;

            _unitOfWork.Tenants.Update(tenant);
            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Tenant configuration updated successfully.", tenant });
        }
    }

    public class TenantConfigurationDto
    {
        public string SubscriptionTier { get; set; } = "Basic";
        public int MaxUsers { get; set; }
        public int MaxPlaqueAnalysesPerMonth { get; set; }
        public bool EnableBilling { get; set; }
        public bool EnableReports { get; set; }
        public string ThemeColor { get; set; } = "#14B8A6";
    }
}
