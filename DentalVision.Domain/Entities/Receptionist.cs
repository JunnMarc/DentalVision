namespace DentalVision.Domain.Entities
{
    public class Receptionist
    {
        public int Id { get; set; } // Matches User.Id (1:1 relation)
        public string EmployeeCode { get; set; } = string.Empty;

        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}
