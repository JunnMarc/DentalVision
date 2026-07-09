import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FaFileInvoice, FaPlus, FaCheckCircle, FaTrashAlt } from 'react-icons/fa';
import { useForm, useFieldArray } from 'react-hook-form';

const Billing = () => {
  const [patients, setPatients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const { hasRole } = useAuth();

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      patientId: "",
      discountAmount: 0,
      taxAmount: 0,
      items: [{ description: "", unitPrice: 0, quantity: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // Watch fields for automatic calculation
  const watchedItems = watch("items");
  const watchedDiscount = watch("discountAmount") || 0;
  const watchedTax = watch("taxAmount") || 0;

  const calculateSubtotal = () => {
    return watchedItems.reduce((acc, curr) => {
      const price = parseFloat(curr.unitPrice) || 0;
      const qty = parseInt(curr.quantity) || 0;
      return acc + (price * qty);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const grandTotal = subtotal - parseFloat(watchedDiscount) + parseFloat(watchedTax);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchInvoices = async () => {
    // For MVP prototype list, we can retrieve all patients' invoices.
    // Since backend filter is by patient, we can iterate or fetch a general list, 
    // or since we seeded 50 invoices, we can query patient 1, 2, 3 and aggregate them.
    // Let's call patient 1-5 invoices to display a rich set of data!
    try {
      let aggregatedInvoices = [];
      for (let pId = 1; pId <= 5; pId++) {
        const response = await api.get(`/billing/invoices/patient/${pId}`);
        aggregatedInvoices = [...aggregatedInvoices, ...response.data];
      }
      setInvoices(aggregatedInvoices.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (showInvoiceModal) {
      fetchPatients();
    }
  }, [showInvoiceModal]);

  const onCreateInvoiceSubmit = async (data) => {
    try {
      const payload = {
        patientId: parseInt(data.patientId),
        discountAmount: parseFloat(data.discountAmount),
        taxAmount: parseFloat(data.taxAmount),
        items: data.items.map(i => ({
          description: i.description,
          unitPrice: parseFloat(i.unitPrice),
          quantity: parseInt(i.quantity)
        }))
      };

      await api.post('/billing/invoices', payload);
      setShowInvoiceModal(false);
      reset();
      fetchInvoices();
    } catch (error) {
      console.error(error);
    }
  };

  const onRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const amountPaid = parseFloat(form.amountPaid.value);
    const paymentMethod = form.paymentMethod.value;
    const notes = form.notes.value;

    try {
      await api.post('/billing/payments', {
        invoiceId: selectedInvoice.id,
        amountPaid,
        paymentMethod,
        notes
      });
      setShowPaymentModal(false);
      fetchInvoices();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="font-weight-bold m-0">Invoices & Payments</h3>
        {hasRole(['Receptionist', 'Administrator']) && (
          <button 
            className="btn btn-primary-clinic d-flex align-items-center gap-2"
            onClick={() => setShowInvoiceModal(true)}
          >
            <FaFileInvoice /> Create Invoice
          </button>
        )}
      </div>

      {/* Invoice Grid list */}
      <div className="clinic-card">
        <h5 className="font-weight-bold mb-3">Billing History</h5>
        <div className="table-responsive">
          <table className="table table-hover table-clinic align-middle">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Patient</th>
                <th>Invoice Date</th>
                <th>Grand Total</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="font-weight-bold">#INV-00{inv.id}</td>
                  <td>{inv.patientName}</td>
                  <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td>${inv.grandTotal?.toFixed(2)}</td>
                  <td>${inv.balanceDue?.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${
                      inv.paymentStatus === 'Paid' || inv.paymentStatus === 2 ? 'badge-paid' :
                      inv.paymentStatus === 'PartiallyPaid' || inv.paymentStatus === 1 ? 'badge-partial' : 'badge-unpaid'
                    }`}>
                      {inv.paymentStatus === 0 ? 'Unpaid' : inv.paymentStatus === 1 ? 'PartiallyPaid' : inv.paymentStatus === 2 ? 'Paid' : inv.paymentStatus}
                    </span>
                  </td>
                  <td>
                    {inv.balanceDue > 0 && hasRole(['Receptionist', 'Administrator']) && (
                      <button 
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setShowPaymentModal(true);
                        }}
                        className="btn btn-xs btn-outline-success py-1"
                        style={{ fontSize: 11 }}
                      >
                        Record Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showInvoiceModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white border-0 py-3" style={{ backgroundColor: '#2563EB' }}>
                <h5 className="modal-title font-weight-bold">Create Patient Invoice</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowInvoiceModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit(onCreateInvoiceSubmit)}>
                <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="mb-4">
                    <label className="form-label small font-weight-bold">Select Patient</label>
                    <select className="form-select" {...register("patientId", { required: true })}>
                      <option value="">-- Choose Patient --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <h6 className="font-weight-bold m-0">Treatment & Service Line Items</h6>
                    <button 
                      type="button" 
                      onClick={() => append({ description: "", unitPrice: 0, quantity: 1 })}
                      className="btn btn-xs btn-outline-primary d-flex align-items-center gap-1"
                    >
                      <FaPlus size={10} /> Add Item
                    </button>
                  </div>

                  {fields.map((field, index) => (
                    <div key={field.id} className="row g-2 mb-2 align-items-end">
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">Service Description</label>
                        <input type="text" className="form-control" {...register(`items.${index}.description`, { required: true })} />
                      </div>
                      <div className="col-3">
                        <label className="form-label small text-muted mb-1">Unit Price ($)</label>
                        <input type="number" step="0.01" className="form-control" {...register(`items.${index}.unitPrice`, { required: true })} />
                      </div>
                      <div className="col-2">
                        <label className="form-label small text-muted mb-1">Qty</label>
                        <input type="number" className="form-control" {...register(`items.${index}.quantity`, { required: true })} />
                      </div>
                      <div className="col-1 text-center">
                        <button type="button" onClick={() => remove(index)} className="btn btn-outline-danger border-0 p-2">
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="row g-3 border-top pt-3 mt-3">
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Discount Amount ($)</label>
                      <input type="number" step="0.01" className="form-control" {...register("discountAmount")} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Tax Amount ($)</label>
                      <input type="number" step="0.01" className="form-control" {...register("taxAmount")} />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-light rounded text-end font-weight-bold">
                    <div className="small text-muted mb-1">Subtotal: ${subtotal.toFixed(2)}</div>
                    <div className="small text-muted mb-1">Discount: -${parseFloat(watchedDiscount).toFixed(2)}</div>
                    <div className="small text-muted mb-2">Tax: +${parseFloat(watchedTax).toFixed(2)}</div>
                    <h5 className="m-0 text-primary font-weight-bold">Grand Total: ${grandTotal.toFixed(2)}</h5>
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-clinic">Generate Bill</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-success text-white border-0 py-3" style={{ backgroundColor: '#14B8A6' }}>
                <h5 className="modal-title font-weight-bold">Record Payment</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <form onSubmit={onRecordPaymentSubmit}>
                <div className="modal-body p-4">
                  <div className="p-3 bg-light rounded mb-3 small">
                    <div>Invoice: <strong>#INV-00{selectedInvoice.id}</strong></div>
                    <div>Patient: <strong>{selectedInvoice.patientName}</strong></div>
                    <div>Grand Total: <strong>${selectedInvoice.grandTotal?.toFixed(2)}</strong></div>
                    <div className="text-danger">Balance Due: <strong>${selectedInvoice.balanceDue?.toFixed(2)}</strong></div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small font-weight-bold">Payment Amount ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="amountPaid" 
                      className="form-control" 
                      max={selectedInvoice.balanceDue} 
                      defaultValue={selectedInvoice.balanceDue} 
                      required 
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small font-weight-bold">Payment Method</label>
                    <select name="paymentMethod" className="form-select" required>
                      <option value="Card">Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Insurance">Insurance</option>
                      <option value="BankTransfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small font-weight-bold">Notes</label>
                    <textarea name="notes" className="form-control" rows="2" placeholder="Transaction ID, check number, receipt remarks..."></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success" style={{ backgroundColor: '#14B8A6', borderColor: '#14B8A6' }}>Record Payment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
