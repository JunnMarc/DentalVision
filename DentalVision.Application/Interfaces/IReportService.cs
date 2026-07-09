using System.Collections.Generic;
using System.Threading.Tasks;
using DentalVision.Application.DTOs;

namespace DentalVision.Application.Interfaces
{
    public interface IReportService
    {
        Task<ClinicalReportDto?> GetReportByIdAsync(int id);
        Task<ClinicalReportDto?> GetReportByAnalysisIdAsync(int analysisId);
        Task<IEnumerable<ClinicalReportDto>> GetReportsByPatientIdAsync(int patientId);
        Task<ClinicalReportDto> CreateReportAsync(CreateClinicalReportDto request);
        Task<byte[]?> ExportReportPdfAsync(int reportId);
    }
}
