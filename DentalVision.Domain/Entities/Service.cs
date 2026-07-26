using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace DentalVision.Domain.Entities
{
    public class Service
    {
        [Column("ServiceID")]
        public int Id { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Description { get; set; }

        // Navigation property
        public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
    }
}
