namespace DentalVision.Domain.Entities
{
    public class PlaqueMapping
    {
        public int Id { get; set; }
        public int AnalysisId { get; set; }
        public int ToothNumber { get; set; }
        public string PlaqueLevel { get; set; } = "Low"; // Low, Medium, High
        public string GumlineRegion { get; set; } = "Cervical"; // Cervical, Interproximal, Margin
        public string CoordinatesJson { get; set; } = "[]"; // Serialized nodes/points for overlay drawing

        // Navigation property
        public virtual PlaqueAnalysis PlaqueAnalysis { get; set; } = null!;
    }
}
