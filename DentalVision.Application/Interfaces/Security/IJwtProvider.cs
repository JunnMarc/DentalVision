using DentalVision.Domain.Entities;

namespace DentalVision.Application.Interfaces.Security
{
    public interface IJwtProvider
    {
        string GenerateToken(User user);
    }
}
