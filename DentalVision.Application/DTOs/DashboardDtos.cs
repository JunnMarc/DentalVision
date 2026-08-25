using System;
using System.Collections.Generic;

namespace DentalVision.Application.DTOs
{
    // Admin Dashboard DTO
    public class AdminDashboardDto
    {
        public int TotalPatients { get; set; }
        public int TodaysAppointments { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public int PendingReportsCount { get; set; }
        public List<ChartDataPointDto> RevenueTrend { get; set; } = new List<ChartDataPointDto>();
        public List<ChartDataPointDto> PatientGrowth { get; set; } = new List<ChartDataPointDto>();
        public List<ChartDataPointDto> PlaqueTrends { get; set; } = new List<ChartDataPointDto>();
    }

    public class ChartDataPointDto
    {
        public string Label { get; set; } = string.Empty; // e.g. "Jan", "2026-07-09"
        public decimal Value { get; set; }
    }

    // Dentist Dashboard DTO
    public class DentistDashboardDto
    {
        public int TodaysPatientsCount { get; set; }
        public List<PendingValidationDto> PendingValidations { get; set; } = new List<PendingValidationDto>();
        public List<RecentReportDto> RecentReports { get; set; } = new List<RecentReportDto>();
    }

    public class PendingValidationDto
    {
        public int AnalysisId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public decimal CoveragePercentage { get; set; }
    }

    public class RecentReportDto
    {
        public int ReportId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public DateTime ReportDate { get; set; }
        public decimal PlaquePercentage { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    // Receptionist Dashboard DTO
    public class ReceptionistDashboardDto
    {
        public int ActiveQueueCount { get; set; }
        public int TotalUnpaidInvoices { get; set; }
        public decimal UnpaidBalanceSum { get; set; }
        public List<TodaysAppointmentDto> ScheduledToday { get; set; } = new List<TodaysAppointmentDto>();
    }

    public class TodaysAppointmentDto
    {
        public int AppointmentId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string DentistName { get; set; } = string.Empty;
        public DateTime Time { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    // Super Admin Dashboard DTO
    public class SuperAdminDashboardDto
    {
        public int TotalClinics { get; set; }
        public int TotalUsers { get; set; }
        public int TotalPlaqueAnalyses { get; set; }
        public decimal TotalRevenue { get; set; }
        public List<TenantDetailDto> Tenants { get; set; } = new List<TenantDetailDto>();
    }

    public class TenantDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string SubscriptionTier { get; set; } = "Basic";
        public int MaxUsers { get; set; }
        public int MaxPlaqueAnalysesPerMonth { get; set; }
        public bool EnableBilling { get; set; }
        public bool EnableReports { get; set; }
        public string ThemeColor { get; set; } = "#14B8A6";
    }
}
