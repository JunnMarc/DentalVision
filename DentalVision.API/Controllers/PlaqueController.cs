using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;
using DentalVision.Domain.Entities;
using DentalVision.Domain.Enums;
using DentalVision.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DentalVision.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlaqueController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IImageProcessingService _imageProcessingService;
        private readonly IMapper _mapper;

        public PlaqueController(IUnitOfWork unitOfWork, IImageProcessingService imageProcessingService, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _imageProcessingService = imageProcessingService;
            _mapper = mapper;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage(
            [FromForm] IFormFile file, 
            [FromForm] int patientId, 
            [FromForm] string? notes,
            [FromForm] int? brightness,
            [FromForm] decimal? contrast,
            [FromForm] int? denoise)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Invalid or empty image file" });
            }

            // Create uploads directory if not exists
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Save file
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Read current user sub ID from JWT
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdStr, out int userId);

            // Create DentalImage entity
            var dentalImage = new DentalImage
            {
                PatientId = patientId,
                UploadedByUserId = userId > 0 ? userId : 1, // Fallback to Admin
                FilePath = $"/uploads/{uniqueFileName}",
                Notes = notes ?? "Dental photo uploaded.",
                UploadedAt = DateTime.UtcNow
            };

            await _unitOfWork.DentalImages.AddAsync(dentalImage);
            await _unitOfWork.CompleteAsync();

            // Run automated plaque mapping pipeline (with Python script bridge)
            var analysisResult = await _imageProcessingService.AnalyzeDentalImageAsync(
                filePath, 
                dentalImage.Id, 
                brightness ?? 0, 
                contrast ?? 1.0m, 
                denoise ?? 3);

            // Save simulated analysis
            var analysis = new PlaqueAnalysis
            {
                ImageId = dentalImage.Id,
                CoveragePercentage = analysisResult.CoveragePercentage,
                ConfidenceScore = analysisResult.ConfidenceScore,
                Status = AnalysisStatus.PendingValidation,
                DetectedRegions = analysisResult.DetectedRegions,
                OverlayImagePath = analysisResult.EngineUsed,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.PlaqueAnalyses.AddAsync(analysis);
            await _unitOfWork.CompleteAsync(); // Generates analysis.Id

            // Save mappings
            foreach (var mappingDto in analysisResult.Mappings)
            {
                var mapping = _mapper.Map<PlaqueMapping>(mappingDto);
                mapping.AnalysisId = analysis.Id;
                await _unitOfWork.PlaqueMappings.AddAsync(mapping);
            }
            await _unitOfWork.CompleteAsync();

            var mappedAnalysis = _unitOfWork.PlaqueAnalyses.Find(a => a.Id == analysis.Id).Include(a => a.PlaqueMappings).First();
            var analysisDto = _mapper.Map<PlaqueAnalysisDto>(mappedAnalysis);

            return Ok(new
            {
                imageId = dentalImage.Id,
                filePath = dentalImage.FilePath,
                analysis = analysisDto
            });
        }

        [HttpGet("analysis/{analysisId}")]
        public async Task<IActionResult> GetAnalysis(int analysisId)
        {
            var analysis = _unitOfWork.PlaqueAnalyses.Find(a => a.Id == analysisId).Include(a => a.PlaqueMappings).FirstOrDefault();
            if (analysis == null) return NotFound(new { message = "Analysis record not found" });

            return Ok(_mapper.Map<PlaqueAnalysisDto>(analysis));
        }

        [HttpPost("analysis/{analysisId}/validate")]
        [Authorize(Roles = "Dentist,Administrator")]
        public async Task<IActionResult> ValidateAnalysis(int analysisId, [FromBody] ValidateAnalysisDto request)
        {
            var analysis = _unitOfWork.PlaqueAnalyses.Find(a => a.Id == analysisId).FirstOrDefault();
            if (analysis == null) return NotFound(new { message = "Analysis record not found" });

            // Read dentist ID from claims
            var dentistUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(dentistUserIdStr, out int dentistUserId);

            analysis.CoveragePercentage = request.ApprovedPercentage;
            analysis.Status = AnalysisStatus.Approved;
            analysis.ApprovedByDentistId = dentistUserId > 0 ? dentistUserId : (int?)null;
            analysis.ApprovedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(request.ApprovedRegions))
            {
                analysis.DetectedRegions = request.ApprovedRegions;
            }

            // Remove old mappings and update with revised dentist mappings
            var oldMappings = _unitOfWork.PlaqueMappings.Find(m => m.AnalysisId == analysisId).ToList();
            foreach (var oldMapping in oldMappings)
            {
                _unitOfWork.PlaqueMappings.Remove(oldMapping);
            }

            foreach (var mappingDto in request.Mappings)
            {
                var mapping = _mapper.Map<PlaqueMapping>(mappingDto);
                mapping.AnalysisId = analysisId;
                await _unitOfWork.PlaqueMappings.AddAsync(mapping);
            }

            _unitOfWork.PlaqueAnalyses.Update(analysis);
            await _unitOfWork.CompleteAsync();

            // Auto-create/update a Clinical Report draft
            var clinicalReport = _unitOfWork.ClinicalReports.Find(r => r.AnalysisId == analysisId).FirstOrDefault();
            if (clinicalReport == null)
            {
                var image = await _unitOfWork.DentalImages.GetByIdAsync(analysis.ImageId);
                clinicalReport = new ClinicalReport
                {
                    PatientId = image!.PatientId,
                    DentistId = dentistUserId > 0 ? dentistUserId : image.UploadedByUserId,
                    AnalysisId = analysisId,
                    ReportDate = DateTime.UtcNow,
                    DentistNotes = request.DentistNotes ?? "Plaque analysis validated.",
                    Recommendations = request.Recommendations ?? "Standard brushing routine recommended.",
                    ApprovalStatus = "Approved"
                };
                await _unitOfWork.ClinicalReports.AddAsync(clinicalReport);
            }
            else
            {
                clinicalReport.DentistNotes = request.DentistNotes ?? clinicalReport.DentistNotes;
                clinicalReport.Recommendations = request.Recommendations ?? clinicalReport.Recommendations;
                clinicalReport.ApprovalStatus = "Approved";
                _unitOfWork.ClinicalReports.Update(clinicalReport);
            }
            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Analysis successfully validated, dental record and clinical report created." });
        }

        [HttpGet("analysis/image/{imageId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetImage(int imageId)
        {
            var image = await _unitOfWork.DentalImages.GetByIdAsync(imageId);
            if (image == null) return NotFound();

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", image.FilePath.TrimStart('/'));
            if (!System.IO.File.Exists(filePath))
            {
                // Return fallback plaque image to keep frontend drawing correctly
                var fallbackPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "dental_plaque_disclosed_1.png");
                if (System.IO.File.Exists(fallbackPath))
                {
                    return PhysicalFile(fallbackPath, "image/png");
                }
                return NotFound();
            }

            var mimeType = "image/png";
            if (filePath.EndsWith(".jpg") || filePath.EndsWith(".jpeg")) mimeType = "image/jpeg";

            return PhysicalFile(filePath, mimeType);
        }
    }
}
