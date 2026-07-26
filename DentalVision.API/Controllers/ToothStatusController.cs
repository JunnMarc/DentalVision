using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using DentalVision.Application.DTOs;
using DentalVision.Domain.Entities;
using DentalVision.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ToothStatusController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        // Thread-safe static dictionary to store tooth statuses in memory per patient.
        // Key: patientId, Value: List of ToothStatus objects
        private static readonly ConcurrentDictionary<int, List<ToothStatus>> MemoryCache = new();

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

            // Look up or initialize in-memory list
            var statuses = MemoryCache.GetOrAdd(patientId, pid =>
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
                        PatientId = pid,
                        ToothNumber = tooth,
                        Status = "Healthy",
                        Notes = string.Empty,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                return list;
            });

            // Return sorted by tooth number
            var sorted = statuses.OrderBy(s => s.ToothNumber).ToList();
            return Ok(_mapper.Map<List<ToothStatusDto>>(sorted));
        }

        [HttpPost("patient/{patientId}")]
        public async Task<IActionResult> UpdatePatientOdontogram(int patientId, [FromBody] List<UpdateToothStatusDto> updates)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(patientId);
            if (patient == null) return NotFound("Patient not found");

            if (updates == null || updates.Count == 0) return BadRequest("No tooth status updates provided");

            // Look up or initialize in-memory list
            var existingStatuses = MemoryCache.GetOrAdd(patientId, pid =>
            {
                var list = new List<ToothStatus>();
                int[] teeth = {
                    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
                    38, 37, 36, 35, 34, 33, 32, 31, 48, 47, 46, 45, 44, 43, 42, 41
                };
                foreach (var tooth in teeth)
                {
                    list.Add(new ToothStatus
                    {
                        PatientId = pid,
                        ToothNumber = tooth,
                        Status = "Healthy",
                        Notes = string.Empty,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                return list;
            });

            lock (existingStatuses)
            {
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
                        existingStatuses.Add(new ToothStatus
                        {
                            PatientId = patientId,
                            ToothNumber = update.ToothNumber,
                            Status = update.Status,
                            Notes = update.Notes,
                            UpdatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            var sorted = existingStatuses.OrderBy(s => s.ToothNumber).ToList();
            return Ok(_mapper.Map<List<ToothStatusDto>>(sorted));
        }
    }
}
