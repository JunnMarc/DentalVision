using System.Threading.Tasks;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PatientsController : ControllerBase
    {
        private readonly IPatientService _patientService;

        public PatientsController(IPatientService patientService)
        {
            _patientService = patientService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search)
        {
            var patients = await _patientService.GetAllAsync(search);
            return Ok(patients);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var patient = await _patientService.GetByIdAsync(id);
            if (patient == null) return NotFound(new { message = "Patient not found" });
            return Ok(patient);
        }

        [HttpPost]
        [Authorize(Roles = "Receptionist,Administrator")]
        public async Task<IActionResult> Create([FromBody] CreatePatientDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var patient = await _patientService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = patient.Id }, patient);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Dentist,Receptionist,Administrator")]
        public async Task<IActionResult> Update(int id, [FromBody] CreatePatientDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var patient = await _patientService.UpdateAsync(id, request);
            if (patient == null) return NotFound(new { message = "Patient not found" });

            return Ok(patient);
        }

        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                ?? User.FindFirst("email")?.Value;
            
            if (string.IsNullOrEmpty(email)) return BadRequest("User email claim not found in token");

            var patient = await _patientService.GetByEmailAsync(email);
            if (patient == null) return NotFound(new { message = "Patient profile not found for this user" });

            return Ok(patient);
        }

        [HttpPost("my-profile")]
        public async Task<IActionResult> CreateOrUpdateMyProfile([FromBody] CreatePatientDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(email)) return BadRequest("User email claim not found in token");

            var patient = await _patientService.CreateOrUpdateForEmailAsync(email, request);
            return Ok(patient);
        }
    }
}
