using System;
using System.Threading.Tasks;
using DentalVision.Domain.Entities;

namespace DentalVision.Domain.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IRepository<User> Users { get; }
        IRepository<Dentist> Dentists { get; }
        IRepository<Receptionist> Receptionists { get; }
        IRepository<Patient> Patients { get; }
        IRepository<Appointment> Appointments { get; }
        IRepository<Invoice> Invoices { get; }
        IRepository<InvoiceItem> InvoiceItems { get; }
        IRepository<Payment> Payments { get; }
        IRepository<DentalImage> DentalImages { get; }
        IRepository<PlaqueAnalysis> PlaqueAnalyses { get; }
        IRepository<PlaqueMapping> PlaqueMappings { get; }
        IRepository<ClinicalReport> ClinicalReports { get; }
        IRepository<AuditLog> AuditLogs { get; }
        IRepository<Notification> Notifications { get; }
        IRepository<ClinicSetting> ClinicSettings { get; }
        IRepository<ToothStatus> ToothStatuses { get; }
        Task<int> CompleteAsync();
    }
}
