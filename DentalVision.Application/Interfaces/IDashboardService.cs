using System.Threading.Tasks;
using DentalVision.Application.DTOs;

namespace DentalVision.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<AdminDashboardDto> GetAdminMetricsAsync();
        Task<DentistDashboardDto> GetDentistMetricsAsync(int dentistUserId);
        Task<ReceptionistDashboardDto> GetReceptionistMetricsAsync();
    }
}
