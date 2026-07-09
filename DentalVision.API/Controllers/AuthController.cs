using System.Threading.Tasks;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var response = await _authService.LoginAsync(request);
            if (response == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            return Ok(response);
        }

        [HttpPost("register")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var response = await _authService.RegisterAsync(request);
                return CreatedAtAction(nameof(Login), new { email = response.Email }, response);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
