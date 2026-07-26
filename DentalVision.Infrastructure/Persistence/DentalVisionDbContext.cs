using Microsoft.EntityFrameworkCore;
using DentalVision.Domain.Entities;

namespace DentalVision.Infrastructure.Persistence
{
    public class DentalVisionDbContext : DbContext
    {
        private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor? _httpContextAccessor;

        public DentalVisionDbContext(
            DbContextOptions<DentalVisionDbContext> options,
            Microsoft.AspNetCore.Http.IHttpContextAccessor? httpContextAccessor = null) : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Dentist> Dentists { get; set; } = null!;
        public DbSet<Receptionist> Receptionists { get; set; } = null!;
        public DbSet<Patient> Patients { get; set; } = null!;
        public DbSet<Appointment> Appointments { get; set; } = null!;
        public DbSet<Invoice> Invoices { get; set; } = null!;
        public DbSet<InvoiceItem> InvoiceItems { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<DentalImage> DentalImages { get; set; } = null!;
        public DbSet<PlaqueAnalysis> PlaqueAnalyses { get; set; } = null!;
        public DbSet<PlaqueMapping> PlaqueMappings { get; set; } = null!;
        public DbSet<ClinicalReport> ClinicalReports { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<ClinicSetting> ClinicSettings { get; set; } = null!;
        public DbSet<Service> Services { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Table mappings matching the ERD naming conventions exactly
            modelBuilder.Entity<User>().ToTable("Users");
            modelBuilder.Entity<Dentist>().ToTable("Users");
            modelBuilder.Entity<Receptionist>().ToTable("Users");
            modelBuilder.Entity<Patient>().ToTable("Patients");
            modelBuilder.Entity<Appointment>().ToTable("Appointments");
            modelBuilder.Entity<Invoice>().ToTable("Invoices");
            modelBuilder.Entity<InvoiceItem>().ToTable("Invoice_items");
            modelBuilder.Entity<Payment>().ToTable("Payments");
            modelBuilder.Entity<ClinicSetting>().ToTable("Clinic_settings");
            modelBuilder.Entity<ClinicalReport>().ToTable("Clinical_reports");
            modelBuilder.Entity<PlaqueAnalysis>().ToTable("Plaque_analysis");
            modelBuilder.Entity<PlaqueMapping>().ToTable("Plaque_mappings");
            modelBuilder.Entity<DentalImage>().ToTable("Dental_images");
            modelBuilder.Entity<AuditLog>().ToTable("Audit_logs");
            modelBuilder.Entity<Notification>().ToTable("Notifications");
            modelBuilder.Entity<Service>().ToTable("Services");

            // InvoiceItem -> Service relationship
            modelBuilder.Entity<InvoiceItem>()
                .HasOne(ii => ii.Service)
                .WithMany(s => s.InvoiceItems)
                .HasForeignKey(ii => ii.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            // 1:1 relation User -> Dentist
            modelBuilder.Entity<Dentist>()
                .HasKey(d => d.Id);
            modelBuilder.Entity<Dentist>()
                .HasOne(d => d.User)
                .WithOne(u => u.Dentist)
                .HasForeignKey<Dentist>(d => d.Id)
                .OnDelete(DeleteBehavior.Cascade);

            // 1:1 relation User -> Receptionist
            modelBuilder.Entity<Receptionist>()
                .HasKey(r => r.Id);
            modelBuilder.Entity<Receptionist>()
                .HasOne(r => r.User)
                .WithOne(u => u.Receptionist)
                .HasForeignKey<Receptionist>(r => r.Id)
                .OnDelete(DeleteBehavior.Cascade);

            // 1:1 relation DentalImage -> PlaqueAnalysis
            modelBuilder.Entity<PlaqueAnalysis>()
                .HasOne(pa => pa.DentalImage)
                .WithOne(di => di.PlaqueAnalysis)
                .HasForeignKey<PlaqueAnalysis>(pa => pa.ImageId)
                .OnDelete(DeleteBehavior.Cascade);

            // 1:1 relation PlaqueAnalysis -> ClinicalReport
            modelBuilder.Entity<ClinicalReport>()
                .HasOne(cr => cr.PlaqueAnalysis)
                .WithOne(pa => pa.ClinicalReport)
                .HasForeignKey<ClinicalReport>(cr => cr.AnalysisId)
                .OnDelete(DeleteBehavior.Restrict);

            // 1:N relation PlaqueAnalysis -> PlaqueMappings
            modelBuilder.Entity<PlaqueMapping>()
                .HasOne(pm => pm.PlaqueAnalysis)
                .WithMany(pa => pa.PlaqueMappings)
                .HasForeignKey(pm => pm.AnalysisId)
                .OnDelete(DeleteBehavior.Cascade);

            // DentalImage -> User relationship (UploadedBy)
            modelBuilder.Entity<DentalImage>()
                .HasOne(di => di.UploadedByUser)
                .WithMany()
                .HasForeignKey(di => di.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Cascade configurations for Billing
            modelBuilder.Entity<Invoice>()
                .HasMany(i => i.Items)
                .WithOne(item => item.Invoice)
                .HasForeignKey(item => item.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Invoice>()
                .HasMany(i => i.Payments)
                .WithOne(p => p.Invoice)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Decimal scale configurations
            modelBuilder.Entity<Invoice>().Property(i => i.TotalAmount).HasPrecision(18, 2);
            modelBuilder.Entity<Invoice>().Property(i => i.DiscountAmount).HasPrecision(18, 2);
            modelBuilder.Entity<Invoice>().Property(i => i.TaxAmount).HasPrecision(18, 2);
            modelBuilder.Entity<Invoice>().Property(i => i.GrandTotal).HasPrecision(18, 2);
            modelBuilder.Entity<Invoice>().Property(i => i.BalanceDue).HasPrecision(18, 2);

            modelBuilder.Entity<InvoiceItem>().Property(ii => ii.UnitPrice).HasPrecision(18, 2);
            modelBuilder.Entity<InvoiceItem>().Property(ii => ii.LineTotal).HasPrecision(18, 2);

            modelBuilder.Entity<Payment>().Property(p => p.AmountPaid).HasPrecision(18, 2);

            modelBuilder.Entity<PlaqueAnalysis>().Property(pa => pa.CoveragePercentage).HasPrecision(5, 2);
            modelBuilder.Entity<PlaqueAnalysis>().Property(pa => pa.ConfidenceScore).HasPrecision(3, 2);

            modelBuilder.Entity<Service>().Property(s => s.Price).HasPrecision(18, 2);

        }

        public override int SaveChanges()
        {
            OnBeforeSaveChanges();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(System.Threading.CancellationToken cancellationToken = default)
        {
            OnBeforeSaveChanges();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void OnBeforeSaveChanges()
        {
            ChangeTracker.DetectChanges();
            var auditEntries = new System.Collections.Generic.List<AuditEntry>();

            var httpContext = _httpContextAccessor?.HttpContext;
            var userIdStr = httpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            int? currentUserId = int.TryParse(userIdStr, out var id) ? id : null;
            var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                var auditEntry = new AuditEntry(entry)
                {
                    TableName = entry.Entity.GetType().Name,
                    LogType = "System",
                    UserId = currentUserId,
                    IpAddress = ipAddress
                };
                auditEntries.Add(auditEntry);

                foreach (var property in entry.Properties)
                {
                    string propertyName = property.Metadata.Name;
                    if (property.Metadata.IsPrimaryKey())
                    {
                        auditEntry.KeyValues[propertyName] = property.CurrentValue;
                        continue;
                    }

                    switch (entry.State)
                    {
                        case EntityState.Added:
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                            auditEntry.Action = "CREATE";
                            break;

                        case EntityState.Deleted:
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            auditEntry.Action = "DELETE";
                            break;

                        case EntityState.Modified:
                            if (property.IsModified)
                            {
                                auditEntry.OldValues[propertyName] = property.OriginalValue;
                                auditEntry.NewValues[propertyName] = property.CurrentValue;
                                auditEntry.Action = "UPDATE";
                            }
                            break;
                    }
                }
            }

            foreach (var auditEntry in auditEntries)
            {
                AuditLogs.Add(auditEntry.ToAuditLog());
            }
        }

        private class AuditEntry
        {
            public AuditEntry(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
            {
                Entry = entry;
            }

            public Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry Entry { get; }
            public string TableName { get; set; } = string.Empty;
            public string Action { get; set; } = string.Empty;
            public string LogType { get; set; } = "System";
            public int? UserId { get; set; }
            public string? IpAddress { get; set; }
            public System.Collections.Generic.Dictionary<string, object?> KeyValues { get; } = new();
            public System.Collections.Generic.Dictionary<string, object?> OldValues { get; } = new();
            public System.Collections.Generic.Dictionary<string, object?> NewValues { get; } = new();

            public AuditLog ToAuditLog()
            {
                var log = new AuditLog
                {
                    TableName = TableName,
                    Action = Action,
                    LogType = LogType,
                    UserId = UserId,
                    IpAddress = IpAddress,
                    Timestamp = DateTime.UtcNow,
                    RecordId = KeyValues.Values.FirstOrDefault() as int?,
                    OldValues = OldValues.Count == 0 ? null : System.Text.Json.JsonSerializer.Serialize(OldValues),
                    NewValues = NewValues.Count == 0 ? null : System.Text.Json.JsonSerializer.Serialize(NewValues)
                };
                return log;
            }
        }
    }
}
