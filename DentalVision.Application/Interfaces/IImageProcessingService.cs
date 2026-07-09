using System.Threading.Tasks;
using DentalVision.Application.DTOs;

namespace DentalVision.Application.Interfaces
{
    public interface IImageProcessingService
    {
        Task<PlaqueAnalysisResultDto> AnalyzeDentalImageAsync(string imagePath, int imageId);
    }
}
