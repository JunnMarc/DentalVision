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
}
