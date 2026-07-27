using System;
using System.Threading.Tasks;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;
using DentalVision.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;

        public AppointmentsController(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DateTime? date)
        {
            var appointments = await _appointmentService.GetAllAsync(date);
            return Ok(appointments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var appointment = await _appointmentService.GetByIdAsync(id);
            if (appointment == null) return NotFound(new { message = "Appointment not found" });
            return Ok(appointment);
        }

        [HttpPost]
        [Authorize(Roles = "Receptionist,Administrator,Patient,Dentist")]
        public async Task<IActionResult> Create([FromBody] CreateAppointmentDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var appointment = await _appointmentService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, appointment);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAppointmentStatusDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existingAppt = await _appointmentService.GetByIdAsync(id);
            if (existingAppt == null) return NotFound(new { message = "Appointment not found" });

            if (request.Status == AppointmentStatus.Completed)
            {
                var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int loggedInUserId))
                {
                    return Unauthorized(new { message = "Invalid authentication claims" });
                }

                var isDentist = User.IsInRole("Dentist") || User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value == "Dentist";

                if (!isDentist || existingAppt.DentistId != loggedInUserId)
                {
                    return StatusCode(403, new { message = "You do not have permission to mark this appointment as completed." });
                }
            }

            var appointment = await _appointmentService.UpdateStatusAsync(id, request);
            return Ok(appointment);
        }
    }
}
