using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using DentalVision.Application.DTOs;
using DentalVision.Domain.Entities;
using DentalVision.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ToothStatusController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ToothStatusController(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetPatientOdontogram(int patientId)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(patientId);
            if (patient == null) return NotFound("Patient not found");

            var statuses = await _unitOfWork.ToothStatuses
                .Find(ts => ts.PatientId == patientId)
                .ToListAsync();

            // If no tooth statuses exist yet (e.g. new patient), initialize all 32 adult teeth as Healthy
            if (statuses.Count == 0)
            {
                var list = new List<ToothStatus>();
                int[] teeth = {
                    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, // Upper Arch
                    38, 37, 36, 35, 34, 33, 32, 31, 48, 47, 46, 45, 44, 43, 42, 41  // Lower Arch
                };
                foreach (var tooth in teeth)
                {
                    list.Add(new ToothStatus
                    {
                        PatientId = patientId,
                        ToothNumber = tooth,
                        Status = "Healthy",
                        Notes = string.Empty,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                foreach (var item in list)
                {
                    await _unitOfWork.ToothStatuses.AddAsync(item);
                }
                await _unitOfWork.CompleteAsync();
                statuses = list;
            }

            // Return sorted by tooth number
            statuses = statuses.OrderBy(s => s.ToothNumber).ToList();
            return Ok(_mapper.Map<List<ToothStatusDto>>(statuses));
        }

        [HttpPost("patient/{patientId}")]
        public async Task<IActionResult> UpdatePatientOdontogram(int patientId, [FromBody] List<UpdateToothStatusDto> updates)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(patientId);
            if (patient == null) return NotFound("Patient not found");

            if (updates == null || updates.Count == 0) return BadRequest("No tooth status updates provided");

            var existingStatuses = await _unitOfWork.ToothStatuses
                .Find(ts => ts.PatientId == patientId)
                .ToListAsync();

            foreach (var update in updates)
            {
                var existing = existingStatuses.FirstOrDefault(s => s.ToothNumber == update.ToothNumber);
                if (existing != null)
                {
                    existing.Status = update.Status;
                    existing.Notes = update.Notes;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Create new if not found
                    var newStatus = new ToothStatus
                    {
                        PatientId = patientId,
                        ToothNumber = update.ToothNumber,
                        Status = update.Status,
                        Notes = update.Notes,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _unitOfWork.ToothStatuses.AddAsync(newStatus);
                }
            }

            await _unitOfWork.CompleteAsync();
            
            // Refetch all to return fresh, sorted list
            var freshStatuses = await _unitOfWork.ToothStatuses
                .Find(ts => ts.PatientId == patientId)
                .OrderBy(s => s.ToothNumber)
                .ToListAsync();

            return Ok(_mapper.Map<List<ToothStatusDto>>(freshStatuses));
        }
    }
}
