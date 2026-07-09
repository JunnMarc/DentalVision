using System.Security.Claims;
using System.Threading.Tasks;
using DentalVision.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            var data = await _dashboardService.GetAdminMetricsAsync();
            return Ok(data);
        }

        [HttpGet("dentist")]
        [Authorize(Roles = "Dentist")]
        public async Task<IActionResult> GetDentistDashboard()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdStr, out int userId);

            var data = await _dashboardService.GetDentistMetricsAsync(userId > 0 ? userId : 2);
            return Ok(data);
        }

        [HttpGet("receptionist")]
        [Authorize(Roles = "Receptionist")]
        public async Task<IActionResult> GetReceptionistDashboard()
        {
            var data = await _dashboardService.GetReceptionistMetricsAsync();
            return Ok(data);
        }
    }
}
