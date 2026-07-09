using System.Threading.Tasks;
using DentalVision.Domain.Entities;
using DentalVision.Domain.Interfaces;
using DentalVision.Infrastructure.Persistence;

namespace DentalVision.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly DentalVisionDbContext _context;

        public UnitOfWork(DentalVisionDbContext context)
        {
            _context = context;
            Users = new Repository<User>(_context);
            Dentists = new Repository<Dentist>(_context);
            Receptionists = new Repository<Receptionist>(_context);
            Patients = new Repository<Patient>(_context);
            Appointments = new Repository<Appointment>(_context);
            Invoices = new Repository<Invoice>(_context);
            InvoiceItems = new Repository<InvoiceItem>(_context);
            Payments = new Repository<Payment>(_context);
            DentalImages = new Repository<DentalImage>(_context);
            PlaqueAnalyses = new Repository<PlaqueAnalysis>(_context);
            PlaqueMappings = new Repository<PlaqueMapping>(_context);
            ClinicalReports = new Repository<ClinicalReport>(_context);
            AuditLogs = new Repository<AuditLog>(_context);
            Notifications = new Repository<Notification>(_context);
            ClinicSettings = new Repository<ClinicSetting>(_context);
        }

        public IRepository<User> Users { get; }
        public IRepository<Dentist> Dentists { get; }
        public IRepository<Receptionist> Receptionists { get; }
        public IRepository<Patient> Patients { get; }
        public IRepository<Appointment> Appointments { get; }
        public IRepository<Invoice> Invoices { get; }
        public IRepository<InvoiceItem> InvoiceItems { get; }
        public IRepository<Payment> Payments { get; }
        public IRepository<DentalImage> DentalImages { get; }
        public IRepository<PlaqueAnalysis> PlaqueAnalyses { get; }
        public IRepository<PlaqueMapping> PlaqueMappings { get; }
        public IRepository<ClinicalReport> ClinicalReports { get; }
        public IRepository<AuditLog> AuditLogs { get; }
        public IRepository<Notification> Notifications { get; }
        public IRepository<ClinicSetting> ClinicSettings { get; }

        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
