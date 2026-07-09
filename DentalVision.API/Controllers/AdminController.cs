using System;
using System.Linq;
using System.Threading.Tasks;
using DentalVision.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator")]
    public class AdminController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public AdminController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet("auditlogs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = _unitOfWork.AuditLogs.Find(l => true)
                .OrderByDescending(l => l.Timestamp)
                .Take(100)
                .Select(l => new
                {
                    l.Id,
                    l.Action,
                    l.LogType,
                    l.TableName,
                    l.RecordId,
                    l.Timestamp,
                    l.IpAddress,
                    UserEmail = l.User != null ? l.User.Email : "System"
                })
                .ToList();
            return Ok(logs);
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _unitOfWork.ClinicSettings.GetAllAsync();
            return Ok(settings);
        }

        [HttpPut("settings/{id}")]
        public async Task<IActionResult> UpdateSetting(int id, [FromBody] string newValue)
        {
            var setting = await _unitOfWork.ClinicSettings.GetByIdAsync(id);
            if (setting == null) return NotFound();

            setting.SettingValue = newValue;
            _unitOfWork.ClinicSettings.Update(setting);
            await _unitOfWork.CompleteAsync();

            return Ok(setting);
        }
    }
}
