using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using DentalVision.Application.DTOs;
using DentalVision.Application.Interfaces;
using DentalVision.Domain.Entities;
using DentalVision.Domain.Enums;
using DentalVision.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DentalVision.Application.Services
{
    public class BillingService : IBillingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public BillingService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<InvoiceDto?> GetInvoiceByIdAsync(int id)
        {
            var invoice = _unitOfWork.Invoices.Find(i => i.Id == id)
                .Include(i => i.Patient)
                .Include(i => i.Items)
                .FirstOrDefault();
            return _mapper.Map<InvoiceDto>(invoice);
        }

        public async Task<IEnumerable<InvoiceDto>> GetInvoicesByPatientIdAsync(int patientId)
        {
            var invoices = _unitOfWork.Invoices.Find(i => i.PatientId == patientId)
                .Include(i => i.Patient)
                .Include(i => i.Items)
                .ToList();
            return _mapper.Map<IEnumerable<InvoiceDto>>(invoices);
        }

        public async Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto request)
        {
            var invoice = new Invoice
            {
                PatientId = request.PatientId,
                AppointmentId = request.AppointmentId,
                InvoiceDate = DateTime.UtcNow,
                DiscountAmount = request.DiscountAmount,
                TaxAmount = request.TaxAmount,
                CreatedAt = DateTime.UtcNow
            };

            decimal totalAmount = 0;
            foreach (var itemDto in request.Items)
            {
                var item = _mapper.Map<InvoiceItem>(itemDto);
                item.LineTotal = item.UnitPrice * item.Quantity;
                totalAmount += item.LineTotal;
                invoice.Items.Add(item);
            }

            invoice.TotalAmount = totalAmount;
            invoice.GrandTotal = totalAmount - invoice.DiscountAmount + invoice.TaxAmount;
            invoice.BalanceDue = invoice.GrandTotal;
            invoice.PaymentStatus = PaymentStatus.Unpaid;

            await _unitOfWork.Invoices.AddAsync(invoice);
            await _unitOfWork.CompleteAsync();

            var created = _unitOfWork.Invoices.Find(i => i.Id == invoice.Id)
                .Include(i => i.Patient)
                .Include(i => i.Items)
                .First();
            return _mapper.Map<InvoiceDto>(created);
        }

        public async Task<PaymentDto> RecordPaymentAsync(CreatePaymentDto request)
        {
            var invoice = _unitOfWork.Invoices.Find(i => i.Id == request.InvoiceId).FirstOrDefault();
            if (invoice == null)
            {
                throw new Exception("Invoice not found");
            }

            var payment = _mapper.Map<Payment>(request);
            payment.PaymentDate = DateTime.UtcNow;

            await _unitOfWork.Payments.AddAsync(payment);

            // Deduct paid amount
            invoice.BalanceDue -= request.AmountPaid;
            if (invoice.BalanceDue <= 0)
            {
                invoice.BalanceDue = 0;
                invoice.PaymentStatus = PaymentStatus.Paid;
            }
            else if (invoice.BalanceDue < invoice.GrandTotal)
            {
                invoice.PaymentStatus = PaymentStatus.PartiallyPaid;
            }
            else
            {
                invoice.PaymentStatus = PaymentStatus.Unpaid;
            }

            _unitOfWork.Invoices.Update(invoice);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<PaymentDto>(payment);
        }
    }
}
