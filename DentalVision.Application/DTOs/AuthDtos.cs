using System;
using DentalVision.Domain.Enums;

namespace DentalVision.Application.DTOs
{
    public class LoginRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    public class RegisterRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        
        // Dentist / Receptionist specific attributes
        public string? LicenseNumber { get; set; }
        public string? Specialization { get; set; }
        public string? EmployeeCode { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public bool IsActive { get; set; }

        // Tenant Configuration properties passed to client
        public string? SubscriptionTier { get; set; }
        public int MaxUsers { get; set; }
        public int MaxPlaqueAnalysesPerMonth { get; set; }
        public bool EnableBilling { get; set; }
        public bool EnableReports { get; set; }
        public string? ThemeColor { get; set; }
    }

    public class RegisterClinicRequestDto
    {
        public string ClinicName { get; set; } = string.Empty;
        public string ClinicSlug { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        public string AdminPassword { get; set; } = string.Empty;
        public string AdminFirstName { get; set; } = string.Empty;
        public string AdminLastName { get; set; } = string.Empty;
    }
}
