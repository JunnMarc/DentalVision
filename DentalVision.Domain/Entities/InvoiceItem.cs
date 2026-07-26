using System.ComponentModel.DataAnnotations.Schema;

namespace DentalVision.Domain.Entities
{
    public class InvoiceItem
    {
        [Column("InvoiceItemID")]
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public int ServiceId { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; } = 1;

        [Column("Subtotal")]
        public decimal LineTotal { get; set; }

        // Navigation properties
        public virtual Invoice Invoice { get; set; } = null!;
        public virtual Service Service { get; set; } = null!;
    }
}
