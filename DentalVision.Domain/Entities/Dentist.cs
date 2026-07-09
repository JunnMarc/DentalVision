using System.Collections.Generic;

namespace DentalVision.Domain.Entities
{
    public class Dentist
    {
        public int Id { get; set; } // Matches User.Id (1:1 relation)
        public string LicenseNumber { get; set; } = string.Empty;
        public string? Specialization { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public virtual ICollection<PlaqueAnalysis> ApprovedAnalyses { get; set; } = new List<PlaqueAnalysis>();
        public virtual ICollection<ClinicalReport> ClinicalReports { get; set; } = new List<ClinicalReport>();
    }
}
