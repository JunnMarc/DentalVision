using System.Threading.Tasks;
using DentalVision.Application.DTOs;

namespace DentalVision.Application.Interfaces
{
    public interface IImageProcessingService
    {
        Task<PlaqueAnalysisResultDto> AnalyzeDentalImageAsync(string imagePath, int imageId, int brightness = 0, decimal contrast = 1.0m, int denoise = 3);
    }
}
