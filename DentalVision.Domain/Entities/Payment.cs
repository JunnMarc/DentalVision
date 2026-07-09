using System;
using DentalVision.Domain.Enums;

namespace DentalVision.Domain.Entities
{
    public class Payment
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public decimal AmountPaid { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public string? TransactionReference { get; set; }
        public string? Notes { get; set; }

        // Navigation property
        public virtual Invoice Invoice { get; set; } = null!;
    }
}
