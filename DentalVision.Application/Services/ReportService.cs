using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
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
            var report = _unitOfWork.ClinicalReports.Find(r => r.Id == reportId)
                .Include(r => r.Patient)
                .Include(r => r.PlaqueAnalysis)
                .Include(r => r.Dentist)
                .ThenInclude(d => d.User)
                .FirstOrDefault();

            if (report == null) return null;

            // Setup QuestPDF Community License (Required for runtime execution)
            QuestPDF.Settings.License = LicenseType.Community;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial").FontColor(Colors.Grey.Darken3));

                    // Header Band
                    page.Header()
                        .BorderBottom(1.5f).BorderColor(Colors.Blue.Medium)
                        .PaddingBottom(10)
                        .Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("MANUALES DENTAL CLINIC").FontSize(16).Bold().FontColor(Colors.Blue.Medium);
                                col.Item().Text("Clinical Assessment & Plaque Mapping").FontSize(10).Italic().FontColor(Colors.Grey.Medium);
                            });

                            row.ConstantItem(120).Column(col =>
                            {
                                col.Item().Text($"REPORT ID: #RP-{report.Id:000}").Bold().FontSize(11).FontColor(Colors.Grey.Darken4);
                                col.Item().Text($"Date: {report.ReportDate.ToShortDateString()}").FontSize(9);
                            });
                        });

                    // Body
                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(15);

                            // Patient & Dentist Metadata Box
                            column.Item().Background(Colors.Grey.Lighten4).Padding(12).Row(row =>
                            {
                                row.RelativeItem().Column(col =>
                                {
                                    col.Item().Text("PATIENT DETAILS").Bold().FontSize(9).FontColor(Colors.Grey.Darken1);
                                    col.Item().Text($"Name: {report.Patient.FirstName} {report.Patient.LastName}").Bold().FontSize(11);
                                    col.Item().Text($"Patient ID: #{report.PatientId}");
                                    col.Item().Text($"DOB: {report.Patient.DateOfBirth.ToShortDateString()}");
                                });

                                row.RelativeItem().Column(col =>
                                {
                                    col.Item().Text("CLINICIAN DETAILS").Bold().FontSize(9).FontColor(Colors.Grey.Darken1);
                                    col.Item().Text($"Name: Dr. {report.Dentist.User.FirstName} {report.Dentist.User.LastName}").Bold().FontSize(11);
                                    col.Item().Text($"License No: {report.Dentist.LicenseNumber}");
                                    col.Item().Text($"Specialization: {report.Dentist.Specialization ?? "General Dentistry"}");
                                });
                            });

                            // Plaque Metrics Cards
                            column.Item().Row(row =>
                            {
                                row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(col =>
                                {
                                    col.Item().Text("PLAQUE SEGMENTATION").Bold().FontSize(9).FontColor(Colors.Grey.Darken1);
                                    col.Item().Text($"{report.PlaqueAnalysis.CoveragePercentage}%").Bold().FontSize(22).FontColor(Colors.Red.Medium);
                                    col.Item().Text("Stained Coverage Area").FontSize(9);
                                });

                                row.ConstantItem(15);

                                row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(col =>
                                {
                                    col.Item().Text("ANALYSIS QUALITY").Bold().FontSize(9).FontColor(Colors.Grey.Darken1);
                                    col.Item().Text($"{report.PlaqueAnalysis.ConfidenceScore:0.00}").Bold().FontSize(22).FontColor(Colors.Teal.Medium);
                                    col.Item().Text("AI Model Confidence Score").FontSize(9);
                                });
                            });

                            column.Item().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten2);

                            // Clinical Notes
                            column.Item().Column(col =>
                            {
                                col.Item().Text("DENTIST CLINICAL OBSERVATIONS & NOTES").Bold().FontSize(11).FontColor(Colors.Blue.Darken3);
                                col.Item().PaddingTop(5).Text(report.DentistNotes ?? "No additional clinical notes recorded.").FontSize(10);
                            });

                            // Recommendations
                            column.Item().Column(col =>
                            {
                                col.Item().Text("RECOMMENDED PREVENTIVE TREATMENT PLAN").Bold().FontSize(11).FontColor(Colors.Blue.Darken3);
                                col.Item().PaddingTop(5).Text(report.Recommendations ?? "No clinical recommendations recorded.").FontSize(10);
                            });

                            column.Item().PaddingTop(20).AlignRight().Column(col =>
                            {
                                col.Item().Text("________________________________").Light().FontColor(Colors.Grey.Medium);
                                col.Item().Text($"Dr. {report.Dentist.User.FirstName} {report.Dentist.User.LastName}").Bold();
                                col.Item().Text("Attending Dentist").FontSize(8).FontColor(Colors.Grey.Medium);
                            });
                        });

                    // Footer Page Numbering
                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Page ").FontSize(8).FontColor(Colors.Grey.Medium);
                            x.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                            x.Span(" of ").FontSize(8).FontColor(Colors.Grey.Medium);
                            x.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                            x.Span(" | DentalVision Capstone Prototype Assessment").FontSize(8).FontColor(Colors.Grey.Medium);
                        });
                });
            });

            using (var stream = new MemoryStream())
            {
                document.GeneratePdf(stream);
                return stream.ToArray();
            }
        }
    }
}
