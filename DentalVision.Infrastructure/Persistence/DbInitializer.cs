using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using DentalVision.Domain.Entities;
using DentalVision.Domain.Enums;
using DentalVision.Application.Common;

namespace DentalVision.Infrastructure.Persistence
{
    public static class DbInitializer
    {
        public static void Initialize(DentalVisionDbContext context)
        {
            context.Database.EnsureCreated();

            // Look for any users.
            if (context.Users.Any())
            {
                return;   // DB has been seeded
            }

            // 1. Seed Roles
            var roles = new List<Role>
            {
                new Role { RoleID = 1, RoleName = "Administrator" },
                new Role { RoleID = 2, RoleName = "Dentist" },
                new Role { RoleID = 3, RoleName = "Receptionist" }
            };
            
            // Note: If EF Core mapping uses enum conversions directly, we don't necessarily need a Roles table, 
            // but since we designed it in SQL, let's seed it. Wait! In DbContext, we did not create a Roles DbSet 
            // or mapping for a Role class since UserRole is mapped as an enum. Let's make sure if there is any 
            // Roles class. Let's check DentalVisionDbContext.cs. There is no Roles DbSet. Users.Role is a UserRole enum.
            // Oh, so we do not need to seed a Roles table if UserRole is mapped as an Enum! In our db_schema.sql we had a Roles table,
            // but in the EF Code First representation, let's keep it simple: we can map the Role enum directly as an INT in the DB, 
            // which automatically maps to RoleID or Role column without a separate EF Entity. That's very clean and standard!
            
            // 2. Seed Users
            var users = new List<User>();
            
            // Admin
            var adminUser = new User
            {
                Email = "admin@dentalvision.com",
                PasswordHash = PasswordHasher.HashPassword("Admin123!"),
                FirstName = "Arthur",
                LastName = "Pendragon",
                Role = UserRole.Administrator,
                IsActive = true
            };
            users.Add(adminUser);

            // 5 Dentists
            var specialistSpecializations = new[] { "Orthodontics", "Periodontics", "Endodontics", "Pediatric Dentistry", "Prosthodontics" };
            var dentistUsers = new List<User>();
            for (int i = 1; i <= 5; i++)
            {
                var dentistUser = new User
                {
                    Email = $"dentist{i}@dentalvision.com",
                    PasswordHash = PasswordHasher.HashPassword("Dentist123!"),
                    FirstName = i switch { 1 => "John", 2 => "Sarah", 3 => "Michael", 4 => "Emily", 5 => "Robert", _ => "Dentist" },
                    LastName = i switch { 1 => "Smith", 2 => "Connor", 3 => "Bluth", 4 => "Watson", 5 => "Miller", _ => "Doe" },
                    Role = UserRole.Dentist,
                    IsActive = true
                };
                users.Add(dentistUser);
                dentistUsers.Add(dentistUser);
            }

            // 3 Receptionists
            var receptionistUsers = new List<User>();
            for (int i = 1; i <= 3; i++)
            {
                var receptionistUser = new User
                {
                    Email = $"receptionist{i}@dentalvision.com",
                    PasswordHash = PasswordHasher.HashPassword("Recept123!"),
                    FirstName = i switch { 1 => "Alice", 2 => "Bob", 3 => "Clara", _ => "Receptionist" },
                    LastName = i switch { 1 => "Margatroid", 2 => "Vance", 3 => "Oswald", _ => "Doe" },
                    Role = UserRole.Receptionist,
                    IsActive = true
                };
                users.Add(receptionistUser);
                receptionistUsers.Add(receptionistUser);
            }

            context.Users.AddRange(users);
            context.SaveChanges();

            // Seed Dentist detail profiles
            for (int i = 0; i < dentistUsers.Count; i++)
            {
                var dentist = new Dentist
                {
                    Id = dentistUsers[i].Id,
                    LicenseNumber = $"DEN-LIC-9430{i}",
                    Specialization = specialistSpecializations[i]
                };
                context.Dentists.Add(dentist);
            }

            // Seed Receptionist detail profiles
            for (int i = 0; i < receptionistUsers.Count; i++)
            {
                var receptionist = new Receptionist
                {
                    Id = receptionistUsers[i].Id,
                    EmployeeCode = $"REC-EMP-00{i+1}"
                };
                context.Receptionists.Add(receptionist);
            }
            context.SaveChanges();

            // 3. Seed 20 Patients
            var patients = new List<Patient>();
            var firstNames = new[] { "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen" };
            var lastNames = new[] { "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin" };
            var genders = new[] { "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female" };
            
            var rand = new Random(42);
            for (int i = 0; i < 20; i++)
            {
                var patient = new Patient
                {
                    FirstName = firstNames[i],
                    LastName = lastNames[i],
                    DateOfBirth = DateTime.UtcNow.AddYears(-rand.Next(18, 65)).AddDays(-rand.Next(1, 365)),
                    Gender = genders[i],
                    Phone = $"+1-555-01{i:D2}",
                    Email = $"{firstNames[i].ToLower()}.{lastNames[i].ToLower()}@gmail.com",
                    Address = $"{100 + i * 5} Maple Avenue, Suite {i + 1}",
                    MedicalHistory = i % 4 == 0 ? "High blood pressure, Penicillin allergy." : "No significant medical history.",
                    CreatedAt = DateTime.UtcNow.AddMonths(-3)
                };
                patients.Add(patient);
            }
            context.Patients.AddRange(patients);
            context.SaveChanges();

            // Retrieve saved Dentists
            var activeDentists = context.Dentists.ToList();
            var activePatients = context.Patients.ToList();

            // 4. Seed 50 Appointments
            var appointments = new List<Appointment>();
            for (int i = 0; i < 50; i++)
            {
                var patient = activePatients[i % activePatients.Count];
                var dentist = activeDentists[i % activeDentists.Count];
                
                // Spread appointments from 30 days ago to 10 days in the future
                var appointmentDate = DateTime.Today.AddDays(-30 + (i * 4 / 5)).AddHours(9 + (i % 8));

                var appointment = new Appointment
                {
                    PatientId = patient.Id,
                    DentistId = dentist.Id,
                    AppointmentDate = appointmentDate,
                    Status = appointmentDate < DateTime.Today ? AppointmentStatus.Completed : AppointmentStatus.Scheduled,
                    Reason = (i % 3 == 0) ? "Routine Checkup and Cleaning" :
                             (i % 3 == 1) ? "Cavity Filling on Lower Molar" :
                             "Plaque Mapping and Gum Assessment",
                    Notes = i % 5 == 0 ? "Patient reports sensitivity to cold liquids." : "",
                    CreatedAt = appointmentDate.AddDays(-5)
                };
                appointments.Add(appointment);
            }
            context.Appointments.AddRange(appointments);
            context.SaveChanges();

            // 5. Seed 50 Invoices & 50 Plaque Analyses (for completed appointments)
            var completedAppointments = context.Appointments.Where(a => a.Status == AppointmentStatus.Completed).ToList();
            var billingServices = new[] 
            {
                new { Desc = "Dental Consultation", Price = 75.00m },
                new { Desc = "Professional Scaling & Polishing", Price = 120.00m },
                new { Desc = "Composite Filling", Price = 150.00m },
                new { Desc = "Dental X-Ray", Price = 50.00m }
            };

            for (int i = 0; i < completedAppointments.Count; i++)
            {
                var appt = completedAppointments[i];
                
                // --- INVOICING ---
                var invoice = new Invoice
                {
                    PatientId = appt.PatientId,
                    AppointmentId = appt.Id,
                    InvoiceDate = appt.AppointmentDate.AddHours(1),
                    DiscountAmount = i % 7 == 0 ? 15.00m : 0.00m,
                    TaxAmount = 5.00m,
                    CreatedAt = appt.AppointmentDate.AddHours(1)
                };

                // Add 1 or 2 invoice items
                var item1 = new InvoiceItem
                {
                    Description = billingServices[i % billingServices.Length].Desc,
                    UnitPrice = billingServices[i % billingServices.Length].Price,
                    Quantity = 1,
                    LineTotal = billingServices[i % billingServices.Length].Price
                };
                invoice.Items.Add(item1);

                if (i % 2 == 0)
                {
                    var item2 = new InvoiceItem
                    {
                        Description = billingServices[(i + 1) % billingServices.Length].Desc,
                        UnitPrice = billingServices[(i + 1) % billingServices.Length].Price,
                        Quantity = 1,
                        LineTotal = billingServices[(i + 1) % billingServices.Length].Price
                    };
                    invoice.Items.Add(item2);
                }

                invoice.TotalAmount = invoice.Items.Sum(item => item.LineTotal);
                invoice.GrandTotal = invoice.TotalAmount - invoice.DiscountAmount + invoice.TaxAmount;
                
                // Process payments for some
                if (i % 3 == 0) // Paid
                {
                    invoice.BalanceDue = 0.00m;
                    invoice.PaymentStatus = PaymentStatus.Paid;

                    var payment = new Payment
                    {
                        AmountPaid = invoice.GrandTotal,
                        PaymentDate = invoice.InvoiceDate.AddMinutes(15),
                        PaymentMethod = PaymentMethod.Card,
                        TransactionReference = $"TXN-{appt.Id}{i}94A"
                    };
                    invoice.Payments.Add(payment);
                }
                else if (i % 3 == 1) // Partially Paid
                {
                    var partialAmount = Math.Round(invoice.GrandTotal / 2, 2);
                    invoice.BalanceDue = invoice.GrandTotal - partialAmount;
                    invoice.PaymentStatus = PaymentStatus.PartiallyPaid;

                    var payment = new Payment
                    {
                        AmountPaid = partialAmount,
                        PaymentDate = invoice.InvoiceDate.AddMinutes(15),
                        PaymentMethod = PaymentMethod.Cash,
                        TransactionReference = $"TXN-PART-{appt.Id}{i}"
                    };
                    invoice.Payments.Add(payment);
                }
                else // Unpaid
                {
                    invoice.BalanceDue = invoice.GrandTotal;
                    invoice.PaymentStatus = PaymentStatus.Unpaid;
                }

                context.Invoices.Add(invoice);

                // --- DENTAL IMAGES & PLAQUE ANALYSIS ---
                if (i < 50) // Seed up to 50 plaque analyses
                {
                    var dentistUser = dentistUsers[i % dentistUsers.Count];
                    var image = new DentalImage
                    {
                        PatientId = appt.PatientId,
                        UploadedByUserId = dentistUser.Id,
                        FilePath = $"/uploads/dental_plaque_disclosed_{i + 1}.png",
                        UploadedAt = appt.AppointmentDate.AddMinutes(-5),
                        Notes = "Plaque disclosed using erythrosine dye."
                    };
                    context.DentalImages.Add(image);
                    context.SaveChanges(); // Save to generate image ID

                    var plaqueCoverage = Math.Round((decimal)(rand.NextDouble() * 32.0 + 12.0), 2); // 12% to 44%
                    var confidence = Math.Round((decimal)(0.84 + rand.NextDouble() * 0.12), 2);

                    var analysis = new PlaqueAnalysis
                    {
                        ImageId = image.Id,
                        CoveragePercentage = plaqueCoverage,
                        ConfidenceScore = confidence,
                        Status = i % 4 == 0 ? AnalysisStatus.PendingValidation : AnalysisStatus.Approved,
                        CreatedAt = appt.AppointmentDate.AddMinutes(5),
                        ApprovedByDentistId = i % 4 != 0 ? appt.DentistId : null,
                        ApprovedAt = i % 4 != 0 ? appt.AppointmentDate.AddMinutes(10) : null,
                        DetectedRegions = JsonSerializer.Serialize(new[]
                        {
                            new { tooth = 11, x = 150, y = 250, width = 60, height = 40, intensity = "High" },
                            new { tooth = 21, x = 220, y = 250, width = 55, height = 35, intensity = "Medium" }
                        })
                    };
                    context.PlaqueAnalyses.Add(analysis);
                    context.SaveChanges(); // Save to generate analysis ID

                    // Add mapping coordinates
                    var mappings = new List<PlaqueMapping>
                    {
                        new PlaqueMapping
                        {
                            AnalysisId = analysis.Id,
                            ToothNumber = 11,
                            PlaqueLevel = "High",
                            GumlineRegion = "Cervical",
                            CoordinatesJson = JsonSerializer.Serialize(new[] { new { x = 150, y = 260 }, new { x = 180, y = 280 } })
                        },
                        new PlaqueMapping
                        {
                            AnalysisId = analysis.Id,
                            ToothNumber = 21,
                            PlaqueLevel = "Medium",
                            GumlineRegion = "Interproximal",
                            CoordinatesJson = JsonSerializer.Serialize(new[] { new { x = 220, y = 262 }, new { x = 245, y = 278 } })
                        }
                    };
                    context.PlaqueMappings.AddRange(mappings);

                    // Create reports for approved analyses
                    if (analysis.Status == AnalysisStatus.Approved)
                    {
                        var report = new ClinicalReport
                        {
                            PatientId = appt.PatientId,
                            DentistId = appt.DentistId,
                            AnalysisId = analysis.Id,
                            ReportDate = appt.AppointmentDate.AddMinutes(15),
                            DentistNotes = "Plaque accumulation visible near the cervical margins of upper incisors.",
                            Recommendations = "Instructed patient on modified Bass brushing technique. Prescribed chlorhexidine mouthwash for 1 week.",
                            ApprovalStatus = "Approved",
                            PdfFilePath = $"/reports/clinical_report_patient_{appt.PatientId}_{analysis.Id}.pdf"
                        };
                        context.ClinicalReports.Add(report);
                    }
                }
            }
            context.SaveChanges();

            // Seed global settings
            var settings = new List<ClinicSetting>
            {
                new ClinicSetting { SettingKey = "ClinicName", SettingValue = "DentalVision Digital Care", Description = "Name of the clinic displayed in reports" },
                new ClinicSetting { SettingKey = "PlaqueThresholdHigh", SettingValue = "35.0", Description = "Percentage above which plaque accumulation is classified high" },
                new ClinicSetting { SettingKey = "TaxRate", SettingValue = "0.05", Description = "Default tax rate applied to billing invoices" }
            };
            context.ClinicSettings.AddRange(settings);
            context.SaveChanges();

            // Seed Patient Tooth Statuses
            if (!context.ToothStatuses.Any())
            {
                var allPatients = context.Patients.ToList();
                var toothStatuses = new List<ToothStatus>();
                foreach (var patient in allPatients)
                {
                    toothStatuses.Add(new ToothStatus { PatientId = patient.Id, ToothNumber = 16, Status = "Caries", Notes = "Occlusal decay." });
                    toothStatuses.Add(new ToothStatus { PatientId = patient.Id, ToothNumber = 24, Status = "Restored", Notes = "Amalgam restoration." });
                    toothStatuses.Add(new ToothStatus { PatientId = patient.Id, ToothNumber = 38, Status = "Missing", Notes = "Congenitally missing." });
                    toothStatuses.Add(new ToothStatus { PatientId = patient.Id, ToothNumber = 11, Status = "Healthy", Notes = "" });
                    toothStatuses.Add(new ToothStatus { PatientId = patient.Id, ToothNumber = 21, Status = "Healthy", Notes = "" });
                }
                context.ToothStatuses.AddRange(toothStatuses);
                context.SaveChanges();
            }
        }
    }

    // Role helper class since SQL has Role table but we omitted DB representation to keep it clean.
    public class Role
    {
        public int RoleID { get; set; }
        public string RoleName { get; set; } = string.Empty;
    }
}
