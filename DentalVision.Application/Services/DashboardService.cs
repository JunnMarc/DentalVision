using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;
using DentalVision.Domain.Enums;
using DentalVision.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DentalVision.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IUnitOfWork _unitOfWork;

        public DashboardService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<AdminDashboardDto> GetAdminMetricsAsync()
        {
            var today = DateTime.Today;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            var totalPatients = _unitOfWork.Patients.Find(p => true).Count();
            
            var todaysAppointments = _unitOfWork.Appointments.Find(a => 
                a.AppointmentDate >= today && a.AppointmentDate < today.AddDays(1)
            ).Count();

            var monthlyRevenue = _unitOfWork.Payments.Find(p => 
                p.PaymentDate >= startOfMonth && p.PaymentDate < startOfMonth.AddMonths(1)
            ).ToList().Sum(p => p.AmountPaid);

            var pendingReports = _unitOfWork.PlaqueAnalyses.Find(a => 
                a.Status == AnalysisStatus.PendingValidation
            ).Count();

            // Mock visual trend datasets for the charts
            var revenueTrend = new List<ChartDataPointDto>
            {
                new ChartDataPointDto { Label = "Feb", Value = 4500 },
                new ChartDataPointDto { Label = "Mar", Value = 5200 },
                new ChartDataPointDto { Label = "Apr", Value = 6100 },
                new ChartDataPointDto { Label = "May", Value = 5800 },
                new ChartDataPointDto { Label = "Jun", Value = 7200 },
                new ChartDataPointDto { Label = "Jul", Value = monthlyRevenue > 0 ? monthlyRevenue : 6800 }
            };

            var patientGrowth = new List<ChartDataPointDto>
            {
                new ChartDataPointDto { Label = "Feb", Value = 120 },
                new ChartDataPointDto { Label = "Mar", Value = 135 },
                new ChartDataPointDto { Label = "Apr", Value = 150 },
                new ChartDataPointDto { Label = "May", Value = 168 },
                new ChartDataPointDto { Label = "Jun", Value = 185 },
                new ChartDataPointDto { Label = "Jul", Value = totalPatients }
            };

            var plaqueTrends = new List<ChartDataPointDto>
            {
                new ChartDataPointDto { Label = "Week 1", Value = 45.2m },
                new ChartDataPointDto { Label = "Week 2", Value = 41.8m },
                new ChartDataPointDto { Label = "Week 3", Value = 38.5m },
                new ChartDataPointDto { Label = "Week 4", Value = 33.1m }
            };

            return new AdminDashboardDto
            {
                TotalPatients = totalPatients,
                TodaysAppointments = todaysAppointments,
                MonthlyRevenue = monthlyRevenue,
                PendingReportsCount = pendingReports,
                RevenueTrend = revenueTrend,
                PatientGrowth = patientGrowth,
                PlaqueTrends = plaqueTrends
            };
        }

        public async Task<DentistDashboardDto> GetDentistMetricsAsync(int dentistUserId)
        {
            var today = DateTime.Today;

            var todaysPatientsCount = _unitOfWork.Appointments.Find(a => 
                a.DentistId == dentistUserId && 
                a.AppointmentDate >= today && a.AppointmentDate < today.AddDays(1)
            ).Select(a => a.PatientId).Distinct().Count();

            var pendingValidations = _unitOfWork.PlaqueAnalyses.Find(a => 
                a.Status == AnalysisStatus.PendingValidation
            ).Select(a => new PendingValidationDto
            {
                AnalysisId = a.Id,
                PatientId = a.DentalImage.PatientId,
                PatientName = a.DentalImage.Patient.FirstName + " " + a.DentalImage.Patient.LastName,
                UploadedAt = a.DentalImage.UploadedAt,
                CoveragePercentage = a.CoveragePercentage
            }).Take(5).ToList();

            var recentReports = _unitOfWork.ClinicalReports.Find(r => r.DentistId == dentistUserId)
                .OrderByDescending(r => r.ReportDate)
                .Select(r => new RecentReportDto
                {
                    ReportId = r.Id,
                    PatientId = r.PatientId,
                    PatientName = r.Patient.FirstName + " " + r.Patient.LastName,
                    ReportDate = r.ReportDate,
                    PlaquePercentage = r.PlaqueAnalysis.CoveragePercentage,
                    Status = r.ApprovalStatus
                }).Take(5).ToList();

            return new DentistDashboardDto
            {
                TodaysPatientsCount = todaysPatientsCount,
                PendingValidations = pendingValidations,
                RecentReports = recentReports
            };
        }

        public async Task<ReceptionistDashboardDto> GetReceptionistMetricsAsync()
        {
            var today = DateTime.Today;

            var activeQueueCount = _unitOfWork.Appointments.Find(a => 
                a.AppointmentDate >= today && a.AppointmentDate < today.AddDays(1) && 
                a.Status == AppointmentStatus.Scheduled
            ).Count();

            var unpaidInvoices = _unitOfWork.Invoices.Find(i => 
                i.PaymentStatus == PaymentStatus.Unpaid || i.PaymentStatus == PaymentStatus.PartiallyPaid
            ).ToList();

            var scheduledToday = _unitOfWork.Appointments.Find(a => 
                a.AppointmentDate >= today && a.AppointmentDate < today.AddDays(1)
            ).Select(a => new TodaysAppointmentDto
            {
                AppointmentId = a.Id,
                PatientName = a.Patient.FirstName + " " + a.Patient.LastName,
                DentistName = "Dr. " + a.Dentist.User.FirstName + " " + a.Dentist.User.LastName,
                Time = a.AppointmentDate,
                Status = a.Status.ToString()
            }).ToList();

            return new ReceptionistDashboardDto
            {
                ActiveQueueCount = activeQueueCount,
                TotalUnpaidInvoices = unpaidInvoices.Count,
                UnpaidBalanceSum = unpaidInvoices.Sum(i => i.BalanceDue),
                ScheduledToday = scheduledToday
            };
        }

        public async Task<SuperAdminDashboardDto> GetSuperAdminMetricsAsync()
        {
            var tenants = _unitOfWork.Tenants.Find(t => true).ToList();
            var totalUsers = _unitOfWork.Users.Find(u => true).IgnoreQueryFilters().Count();
            var totalPlaqueAnalyses = _unitOfWork.PlaqueAnalyses.Find(p => true).IgnoreQueryFilters().Count();
            var totalRevenue = _unitOfWork.Payments.Find(p => true).IgnoreQueryFilters().Sum(p => p.AmountPaid);

            var tenantDetails = new List<TenantDetailDto>();
            foreach (var t in tenants)
            {
                var adminEmail = _unitOfWork.Users.Find(u => u.TenantId == t.Id && u.Role == UserRole.Administrator)
                    .IgnoreQueryFilters()
                    .Select(u => u.Email)
                    .FirstOrDefault() ?? "N/A";

                tenantDetails.Add(new TenantDetailDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Slug = t.Slug,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt,
                    AdminEmail = adminEmail,
                    SubscriptionTier = t.SubscriptionTier,
                    MaxUsers = t.MaxUsers,
                    MaxPlaqueAnalysesPerMonth = t.MaxPlaqueAnalysesPerMonth,
                    EnableBilling = t.EnableBilling,
                    EnableReports = t.EnableReports,
                    ThemeColor = t.ThemeColor
                });
            }

            return new SuperAdminDashboardDto
            {
                TotalClinics = tenants.Count,
                TotalUsers = totalUsers,
                TotalPlaqueAnalyses = totalPlaqueAnalyses,
                TotalRevenue = totalRevenue,
                Tenants = tenantDetails
            };
        }
    }
}
