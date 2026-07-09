using System;
using System.Linq;
using System.Threading.Tasks;
using DentalVision.Domain.Interfaces;
using DentalVision.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator")]
    public class UsersController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public UsersController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = _unitOfWork.Users.Find(u => true)
                .OrderBy(u => u.Role)
                .ThenBy(u => u.LastName)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    Role = u.Role.ToString(),
                    u.IsActive,
                    u.CreatedAt
                })
                .ToList();
            return Ok(users);
        }

        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            // Don't allow toggling self
            var currentUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(currentUserIdStr, out int currentUserId) && currentUserId == id)
            {
                return BadRequest(new { message = "Cannot disable your own administrator account." });
            }

            user.IsActive = !user.IsActive;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.CompleteAsync();

            return Ok(new { message = $"User status updated to {(user.IsActive ? "Active" : "Inactive")}", isActive = user.IsActive });
        }
    }
}
