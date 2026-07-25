using AutoMapper;
using DentalVision.Domain.Entities;
using DentalVision.Application.DTOs;

namespace DentalVision.Application.Common
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<User, UserDto>();
            CreateMap<RegisterRequestDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());

            // Patient mappings
            CreateMap<Patient, PatientDto>();
            CreateMap<CreatePatientDto, Patient>();

            // Appointment mappings
            CreateMap<Appointment, AppointmentDto>()
                .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.FirstName + " " + src.Patient.LastName))
                .ForMember(dest => dest.DentistName, opt => opt.MapFrom(src => src.Dentist.User.FirstName + " " + src.Dentist.User.LastName));
            CreateMap<CreateAppointmentDto, Appointment>();

            // Invoice mappings
            CreateMap<Invoice, InvoiceDto>()
                .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.FirstName + " " + src.Patient.LastName));
            CreateMap<InvoiceItem, InvoiceItemDto>();
            CreateMap<CreateInvoiceDto, Invoice>();
            CreateMap<CreateInvoiceItemDto, InvoiceItem>();

            // Payment mappings
            CreateMap<Payment, PaymentDto>();
            CreateMap<CreatePaymentDto, Payment>();

            // Image & Analysis mappings
            CreateMap<DentalImage, DentalImageDto>();
            CreateMap<PlaqueAnalysis, PlaqueAnalysisDto>()
                .ForMember(dest => dest.ApprovedByDentistName, opt => opt.MapFrom(src => src.ApprovedByDentist != null ? src.ApprovedByDentist.User.FirstName + " " + src.ApprovedByDentist.User.LastName : string.Empty))
                .ForMember(dest => dest.Mappings, opt => opt.MapFrom(src => src.PlaqueMappings));
            CreateMap<PlaqueMapping, PlaqueMappingDto>();
            CreateMap<PlaqueMappingDto, PlaqueMapping>();

            // Tooth status mapping
            CreateMap<ToothStatus, ToothStatusDto>();
            CreateMap<ToothStatusDto, ToothStatus>();
            CreateMap<UpdateToothStatusDto, ToothStatus>();

            // Clinical Report mappings
            CreateMap<ClinicalReport, ClinicalReportDto>()
                .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.FirstName + " " + src.Patient.LastName))
                .ForMember(dest => dest.PatientDOB, opt => opt.MapFrom(src => src.Patient.DateOfBirth))
                .ForMember(dest => dest.DentistName, opt => opt.MapFrom(src => src.Dentist.User.FirstName + " " + src.Dentist.User.LastName))
                .ForMember(dest => dest.CoveragePercentage, opt => opt.MapFrom(src => src.PlaqueAnalysis.CoveragePercentage));
        }
    }
}
