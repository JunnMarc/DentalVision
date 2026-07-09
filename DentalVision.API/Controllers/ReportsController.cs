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
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var report = await _reportService.GetReportByIdAsync(id);
            if (report == null) return NotFound(new { message = "Report not found" });
            return Ok(report);
        }

        [HttpGet("analysis/{analysisId}")]
        public async Task<IActionResult> GetByAnalysisId(int analysisId)
        {
            var report = await _reportService.GetReportByAnalysisIdAsync(analysisId);
            if (report == null) return NotFound(new { message = "Report not found for this analysis" });
            return Ok(report);
        }

        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetByPatientId(int patientId)
        {
            var reports = await _reportService.GetReportsByPatientIdAsync(patientId);
            return Ok(reports);
        }

        [HttpPost]
        [Authorize(Roles = "Dentist,Administrator")]
        public async Task<IActionResult> Create([FromBody] CreateClinicalReportDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var report = await _reportService.CreateReportAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = report.Id }, report);
        }

        [HttpGet("{id}/export")]
        public async Task<IActionResult> ExportPdf(int id)
        {
            var fileBytes = await _reportService.ExportReportPdfAsync(id);
            if (fileBytes == null) return NotFound(new { message = "Report document not found" });

            // Returning text stream representing the PDF layout
            return File(fileBytes, "application/pdf", $"clinical_report_{id}.pdf");
        }
    }
}
