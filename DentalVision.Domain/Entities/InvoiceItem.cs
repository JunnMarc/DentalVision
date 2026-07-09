namespace DentalVision.Domain.Entities
{
    public class InvoiceItem
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal LineTotal { get; set; }

        // Navigation property
        public virtual Invoice Invoice { get; set; } = null!;
    }
}
