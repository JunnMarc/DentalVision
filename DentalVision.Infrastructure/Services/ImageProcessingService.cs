using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;

namespace DentalVision.Infrastructure.Services
{
    public class ImageProcessingService : IImageProcessingService
    {
        public async Task<PlaqueAnalysisResultDto> AnalyzeDentalImageAsync(string imagePath, int imageId)
        {
            // Simulate processing delay (800ms)
            await Task.Delay(800);

            // Seed deterministic or semi-random numbers based on imageId
            var random = new Random(imageId);
            var coveragePercentage = Math.Round((decimal)(random.NextDouble() * 35.0 + 15.0), 2); // 15% to 50% plaque
            var confidenceScore = Math.Round((decimal)(0.82 + random.NextDouble() * 0.15), 2);   // 82% to 97% confidence

            // Simulate detection of red regions representing plaque
            var regionsList = new List<object>
            {
                new { tooth = 11, x = 150, y = 250, width = 60, height = 40, intensity = "High" },
                new { tooth = 21, x = 220, y = 250, width = 55, height = 35, intensity = "Medium" },
                new { tooth = 12, x = 100, y = 240, width = 40, height = 30, intensity = "Low" },
                new { tooth = 22, x = 290, y = 240, width = 45, height = 32, intensity = "High" },
                new { tooth = 31, x = 180, y = 350, width = 50, height = 40, intensity = "Medium" },
                new { tooth = 41, x = 240, y = 350, width = 48, height = 38, intensity = "High" }
            };

            var detectedRegions = JsonSerializer.Serialize(regionsList);

            // Generate dental plaque mapping coordinates for the visual canvas editor
            var mappings = new List<PlaqueMappingDto>
            {
                new PlaqueMappingDto
                {
                    ToothNumber = 11,
                    PlaqueLevel = "High",
                    GumlineRegion = "Cervical",
                    CoordinatesJson = JsonSerializer.Serialize(new[] { new { x = 150, y = 260 }, new { x = 180, y = 280 }, new { x = 210, y = 260 } })
                },
                new PlaqueMappingDto
                {
                    ToothNumber = 21,
                    PlaqueLevel = "Medium",
                    GumlineRegion = "Interproximal",
                    CoordinatesJson = JsonSerializer.Serialize(new[] { new { x = 220, y = 262 }, new { x = 245, y = 278 }, new { x = 275, y = 262 } })
                },
                new PlaqueMappingDto
                {
                    ToothNumber = 12,
                    PlaqueLevel = "Low",
                    GumlineRegion = "Margin",
                    CoordinatesJson = JsonSerializer.Serialize(new[] { new { x = 100, y = 248 }, new { x = 120, y = 260 }, new { x = 140, y = 248 } })
                },
                new PlaqueMappingDto
                {
                    ToothNumber = 22,
                    PlaqueLevel = "High",
                    GumlineRegion = "Cervical",
                    CoordinatesJson = JsonSerializer.Serialize(new[] { new { x = 290, y = 248 }, new { x = 312, y = 262 }, new { x = 335, y = 248 } })
                },
                new PlaqueMappingDto
                {
                    ToothNumber = 31,
                    PlaqueLevel = "Medium",
                    GumlineRegion = "Cervical",
                    CoordinatesJson = JsonSerializer.Serialize(new[] { new { x = 180, y = 355 }, new { x = 205, y = 372 }, new { x = 230, y = 355 } })
                },
                new PlaqueMappingDto
                {
                    ToothNumber = 41,
                    PlaqueLevel = "High",
                    GumlineRegion = "Margin",
                    CoordinatesJson = JsonSerializer.Serialize(new[] { new { x = 240, y = 355 }, new { x = 264, y = 375 }, new { x = 288, y = 355 } })
                }
            };

            return new PlaqueAnalysisResultDto
            {
                ImageId = imageId,
                CoveragePercentage = coveragePercentage,
                ConfidenceScore = confidenceScore,
                DetectedRegions = detectedRegions,
                Mappings = mappings
            };
        }
    }
}
