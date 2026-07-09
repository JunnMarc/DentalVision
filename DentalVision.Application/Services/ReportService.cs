using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Threading.Tasks;
using AutoMapper;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;
using DentalVision.Domain.Entities;
using DentalVision.Domain.Enums;
using DentalVision.Domain.Interfaces;

namespace DentalVision.Application.Services
{
    public class ReportService : IReportService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ReportService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ClinicalReportDto?> GetReportByIdAsync(int id)
        {
            var report = _unitOfWork.ClinicalReports.Find(r => r.Id == id).FirstOrDefault();
            return _mapper.Map<ClinicalReportDto>(report);
        }

        public async Task<ClinicalReportDto?> GetReportByAnalysisIdAsync(int analysisId)
        {
            var report = _unitOfWork.ClinicalReports.Find(r => r.AnalysisId == analysisId).FirstOrDefault();
            return _mapper.Map<ClinicalReportDto>(report);
        }

        public async Task<IEnumerable<ClinicalReportDto>> GetReportsByPatientIdAsync(int patientId)
        {
            var reports = _unitOfWork.ClinicalReports.Find(r => r.PatientId == patientId).ToList();
            return _mapper.Map<IEnumerable<ClinicalReportDto>>(reports);
        }

        public async Task<ClinicalReportDto> CreateReportAsync(CreateClinicalReportDto request)
        {
            var analysis = _unitOfWork.PlaqueAnalyses.Find(a => a.Id == request.AnalysisId).FirstOrDefault();
            if (analysis == null)
            {
                throw new Exception("Plaque analysis not found");
            }

            var image = _unitOfWork.DentalImages.Find(i => i.Id == analysis.ImageId).FirstOrDefault();
            if (image == null)
            {
                throw new Exception("Dental image not found");
            }

            var existingReport = _unitOfWork.ClinicalReports.Find(r => r.AnalysisId == request.AnalysisId).FirstOrDefault();
            if (existingReport != null)
            {
                // Update existing
                existingReport.DentistNotes = request.DentistNotes;
                existingReport.Recommendations = request.Recommendations;
                existingReport.ApprovalStatus = request.ApproveReport ? "Approved" : "Draft";
                existingReport.ReportDate = DateTime.UtcNow;

                _unitOfWork.ClinicalReports.Update(existingReport);
                await _unitOfWork.CompleteAsync();
                return _mapper.Map<ClinicalReportDto>(existingReport);
            }

            var report = new ClinicalReport
            {
                PatientId = image.PatientId,
                DentistId = analysis.ApprovedByDentistId ?? image.UploadedByUserId, // Fallback to uploader
                AnalysisId = request.AnalysisId,
                ReportDate = DateTime.UtcNow,
                DentistNotes = request.DentistNotes,
                Recommendations = request.Recommendations,
                ApprovalStatus = request.ApproveReport ? "Approved" : "Draft"
            };

            await _unitOfWork.ClinicalReports.AddAsync(report);
            await _unitOfWork.CompleteAsync();

            var created = _unitOfWork.ClinicalReports.Find(r => r.Id == report.Id).First();
            return _mapper.Map<ClinicalReportDto>(created);
        }

        public async Task<byte[]?> ExportReportPdfAsync(int reportId)
        {
            var report = _unitOfWork.ClinicalReports.Find(r => r.Id == reportId).FirstOrDefault();
            if (report == null) return null;

            // Generate simple PDF layout simulated inside a text structure
            var sb = new StringBuilder();
            sb.AppendLine("=========================================================================");
            sb.AppendLine("                        DENTALVISION CLINICAL REPORT                     ");
            sb.AppendLine("=========================================================================");
            sb.AppendLine($"Report ID     : {report.Id}");
            sb.AppendLine($"Date          : {report.ReportDate.ToShortDateString()}");
            sb.AppendLine($"Patient ID    : {report.PatientId}");
            sb.AppendLine($"Patient Name  : {report.Patient.FirstName} {report.Patient.LastName}");
            sb.AppendLine($"DOB           : {report.Patient.DateOfBirth.ToShortDateString()}");
            sb.AppendLine($"Dentist Name  : Dr. {report.Dentist.User.FirstName} {report.Dentist.User.LastName}");
            sb.AppendLine($"License No.   : {report.Dentist.LicenseNumber}");
            sb.AppendLine("-------------------------------------------------------------------------");
            sb.AppendLine($"Plaque Coverage Percentage: {report.PlaqueAnalysis.CoveragePercentage}%");
            sb.AppendLine($"AI Model Confidence Score  : {report.PlaqueAnalysis.ConfidenceScore}");
            sb.AppendLine($"Approval Status           : {report.ApprovalStatus}");
            sb.AppendLine("-------------------------------------------------------------------------");
            sb.AppendLine("Dentist Clinical Notes:");
            sb.AppendLine(report.DentistNotes ?? "No notes provided.");
            sb.AppendLine();
            sb.AppendLine("Recommendations & Treatment Plan:");
            sb.AppendLine(report.Recommendations ?? "No recommendations provided.");
            sb.AppendLine("=========================================================================");
            sb.AppendLine("Generated by DentalVision Automated System");

            return Encoding.UTF8.GetBytes(sb.ToString());
        }
    }
}
