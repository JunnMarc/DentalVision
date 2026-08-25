using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using DentalVision.Domain.Enums;

namespace DentalVision.Domain.Entities
{
    public class Invoice : ITenantEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int PatientId { get; set; }
        public int? AppointmentId { get; set; }

        [Column("InvoicedDate")]
        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal GrandTotal { get; set; }
        public decimal BalanceDue { get; set; }
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Patient Patient { get; set; } = null!;
        public virtual Appointment? Appointment { get; set; }
        public virtual ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
