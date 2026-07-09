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
        [Authorize(Roles = "Receptionist,Administrator")]
        public async Task<IActionResult> Update(int id, [FromBody] CreatePatientDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var patient = await _patientService.UpdateAsync(id, request);
            if (patient == null) return NotFound(new { message = "Patient not found" });

            return Ok(patient);
        }
    }
}
