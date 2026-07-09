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
    public class BillingController : ControllerBase
    {
        private readonly IBillingService _billingService;

        public BillingController(IBillingService billingService)
        {
            _billingService = billingService;
        }

        [HttpGet("invoices/{id}")]
        public async Task<IActionResult> GetInvoiceById(int id)
        {
            var invoice = await _billingService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound(new { message = "Invoice not found" });
            return Ok(invoice);
        }

        [HttpGet("invoices/patient/{patientId}")]
        public async Task<IActionResult> GetInvoicesByPatient(int patientId)
        {
            var invoices = await _billingService.GetInvoicesByPatientIdAsync(patientId);
            return Ok(invoices);
        }

        [HttpPost("invoices")]
        [Authorize(Roles = "Receptionist,Administrator")]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var invoice = await _billingService.CreateInvoiceAsync(request);
            return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, invoice);
        }

        [HttpPost("payments")]
        [Authorize(Roles = "Receptionist,Administrator")]
        public async Task<IActionResult> RecordPayment([FromBody] CreatePaymentDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var payment = await _billingService.RecordPaymentAsync(request);
                return Ok(payment);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
