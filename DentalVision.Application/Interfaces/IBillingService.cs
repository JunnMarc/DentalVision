using System.Collections.Generic;
using System.Threading.Tasks;
using DentalVision.Application.DTOs;

namespace DentalVision.Application.Interfaces
{
    public interface IBillingService
    {
        Task<InvoiceDto?> GetInvoiceByIdAsync(int id);
        Task<IEnumerable<InvoiceDto>> GetInvoicesByPatientIdAsync(int patientId);
        Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto request);
        Task<PaymentDto> RecordPaymentAsync(CreatePaymentDto request);
    }
}
