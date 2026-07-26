using System.Collections.Generic;
using System.Threading.Tasks;
using DentalVision.Application.DTOs;

namespace DentalVision.Application.Interfaces
{
    public interface IPatientService
    {
        Task<PatientDto?> GetByIdAsync(int id);
        Task<IEnumerable<PatientDto>> GetAllAsync(string? search = null);
        Task<PatientDto> CreateAsync(CreatePatientDto request);
        Task<PatientDto?> UpdateAsync(int id, CreatePatientDto request);
        Task<PatientDto?> GetByEmailAsync(string email);
        Task<PatientDto> CreateOrUpdateForEmailAsync(string email, CreatePatientDto request);
    }
}
