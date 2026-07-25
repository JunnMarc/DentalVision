using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;
using DentalVision.Domain.Entities;
using DentalVision.Domain.Interfaces;

namespace DentalVision.Application.Services
{
    public class PatientService : IPatientService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public PatientService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PatientDto?> GetByIdAsync(int id)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(id);
            return _mapper.Map<PatientDto>(patient);
        }

        public async Task<IEnumerable<PatientDto>> GetAllAsync(string? search = null)
        {
            IEnumerable<Patient> patients;
            if (string.IsNullOrWhiteSpace(search))
            {
                patients = await _unitOfWork.Patients.GetAllAsync();
            }
            else
            {
                var lowerSearch = search.ToLower();
                patients = _unitOfWork.Patients.Find(p => 
                    p.FirstName.ToLower().Contains(lowerSearch) || 
                    p.LastName.ToLower().Contains(lowerSearch) || 
                    (p.Phone != null && p.Phone.Contains(lowerSearch)) || 
                    (p.Email != null && p.Email.ToLower().Contains(lowerSearch))
                ).ToList();
            }

            return _mapper.Map<IEnumerable<PatientDto>>(patients);
        }

        public async Task<PatientDto> CreateAsync(CreatePatientDto request)
        {
            var patient = _mapper.Map<Patient>(request);
            patient.PatientCode = $"PAT-{Guid.NewGuid().ToString().Substring(0, 5).ToUpper()}";
            await _unitOfWork.Patients.AddAsync(patient);
            await _unitOfWork.CompleteAsync();
            return _mapper.Map<PatientDto>(patient);
        }

        public async Task<PatientDto?> UpdateAsync(int id, CreatePatientDto request)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(id);
            if (patient == null) return null;

            _mapper.Map(request, patient);
            _unitOfWork.Patients.Update(patient);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<PatientDto>(patient);
        }
    }
}
