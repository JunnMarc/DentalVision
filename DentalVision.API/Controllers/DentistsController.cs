using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DentalVision.Domain.Interfaces;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DentistsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public DentistsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var dentists = _unitOfWork.Dentists.Find(d => d.User.IsActive)
                .Include(d => d.User)
                .Select(d => new
                {
                    d.Id,
                    Name = $"Dr. {d.User.FirstName} {d.User.LastName} ({d.Specialization ?? "General Dentistry"})",
                    Specialization = d.Specialization,
                    LicenseNumber = d.LicenseNumber,
                    Email = d.User.Email,
                    FirstName = d.User.FirstName,
                    LastName = d.User.LastName
                })
                .ToList();

            return Ok(dentists);
        }
    }
}
