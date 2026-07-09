using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DentalVision.Application.Interfaces.Security;
using DentalVision.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DentalVision.Infrastructure.Services
{
    public class JwtProvider : IJwtProvider
    {
        private readonly IConfiguration _configuration;

        public JwtProvider(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            var secretKey = _configuration["Jwt:Secret"] ?? "SUPER_SECRET_KEY_FOR_DENTALVISION_JWT_TOKEN_SIGNING_ALGORITHM_123456";
            var issuer = _configuration["Jwt:Issuer"] ?? "DentalVisionAPI";
            var audience = _configuration["Jwt:Audience"] ?? "DentalVisionClient";
            var expiryMinutes = double.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "120");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("firstName", user.FirstName),
                new Claim("lastName", user.LastName)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
