import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [viewingInvoice, setViewingInvoice] = useState(null);
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

  const selectedPatientId = watch("patientId");
  const [billingRecommendation, setBillingRecommendation] = useState(null);

  useEffect(() => {
    const fetchLatestReportRecommendation = async () => {
      if (!selectedPatientId) {
        setBillingRecommendation(null);
        return;
      }
      try {
        const response = await api.get(`/reports/patient/${selectedPatientId}`);
        const patientReports = response.data;
        if (patientReports && patientReports.length > 0) {
          const latest = [...patientReports].sort((a, b) => b.id - a.id)[0];
          const recText = latest.recommendations || '';
          
          const match = recText.match(/\[BillingRecommendation:\s*(\d+(\.\d+)?)\s*\|\s*Reason:\s*([^\]]+)\]/);
          if (match) {
            const amount = parseFloat(match[1]);
            const reason = match[3].trim();
            if (amount > 0) {
              setBillingRecommendation({ amount, reason });
              return;
            }
          }
        }
        setBillingRecommendation(null);
      } catch (err) {
        console.error("Failed to load patient clinical reports for pricing recommendation:", err);
        setBillingRecommendation(null);
      }
    };

    fetchLatestReportRecommendation();
  }, [selectedPatientId]);

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
    const paymentMethod = parseInt(form.paymentMethod.value);
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
        {hasRole(['Dental Staff', 'Administrator']) && (
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
                <th className="text-end">Grand Total</th>
                <th className="text-end">Balance Due</th>
                <th className="ps-4">Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="font-weight-bold">#INV-00{inv.id}</td>
                  <td>{inv.patientName}</td>
                  <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td className="text-end">₱{inv.grandTotal?.toFixed(2)}</td>
                  <td className="text-end">₱{inv.balanceDue?.toFixed(2)}</td>
                  <td className="ps-4">
                    <span className="font-weight-bold" style={{ 
                      color: inv.paymentStatus === 'Paid' || inv.paymentStatus === 2 ? '#059669' :
                             inv.paymentStatus === 'PartiallyPaid' || inv.paymentStatus === 1 ? '#D97706' :
                             '#DC2626',
                      fontSize: '13px'
                    }}>
                      ● {inv.paymentStatus === 0 ? 'Unpaid' : inv.paymentStatus === 1 ? 'Partially Paid' : inv.paymentStatus === 2 ? 'Paid' : inv.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <button 
                        onClick={() => setViewingInvoice(inv)}
                        className="btn btn-xs btn-outline-primary py-1"
                        style={{ fontSize: 11 }}
                      >
                        View Details
                      </button>
                      {inv.balanceDue > 0 && hasRole(['Dental Staff', 'Administrator']) && (
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showInvoiceModal && createPortal(
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white border-0 py-3" style={{ backgroundColor: '#2563EB' }}>
                <h5 className="modal-title font-weight-bold text-white">Create Patient Invoice</h5>
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

                  {billingRecommendation && (
                    <div className="alert alert-info border-info d-flex align-items-center justify-content-between p-3 rounded-3 mb-4 text-start" style={{ backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }}>
                      <div>
                        <div className="font-weight-bold text-dark d-flex align-items-center mb-1" style={{ fontSize: '13px' }}>
                          <span className="me-2">💡</span> Dentist Price Recommendation Found
                        </div>
                        <div className="xsmall text-muted" style={{ color: '#0F766E' }}>
                          Adjusted rate: <strong>₱{billingRecommendation.amount}</strong> for <em>{billingRecommendation.reason}</em>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          append({
                            description: `Plaque Cleaning (${billingRecommendation.reason})`,
                            unitPrice: billingRecommendation.amount,
                            quantity: 1
                          });
                          setBillingRecommendation(null);
                        }}
                        className="btn btn-sm btn-teal px-3"
                        style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#0D9488', color: '#ffffff', border: 'none' }}
                      >
                        Apply Adjustment
                      </button>
                    </div>
                  )}

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
                        <label className="form-label small text-muted mb-1">Unit Price (₱)</label>
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
                      <label className="form-label small font-weight-bold">Discount Amount (₱)</label>
                      <input type="number" step="0.01" className="form-control" {...register("discountAmount")} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Tax Amount (₱)</label>
                      <input type="number" step="0.01" className="form-control" {...register("taxAmount")} />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-light rounded text-end font-weight-bold">
                    <div className="small text-muted mb-1">Subtotal: ₱{subtotal.toFixed(2)}</div>
                    <div className="small text-muted mb-1">Discount: -₱{parseFloat(watchedDiscount).toFixed(2)}</div>
                    <div className="small text-muted mb-2">Tax: +₱{parseFloat(watchedTax).toFixed(2)}</div>
                    <h5 className="m-0 text-primary font-weight-bold">Grand Total: ₱{grandTotal.toFixed(2)}</h5>
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-clinic">Generate Bill</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && createPortal(
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-success text-white border-0 py-3" style={{ backgroundColor: '#14B8A6' }}>
                <h5 className="modal-title font-weight-bold text-white">Record Payment</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <form onSubmit={onRecordPaymentSubmit}>
                <div className="modal-body p-4">
                  <div className="p-3 bg-light rounded mb-3 small text-start">
                    <div className="mb-2 pb-2 border-bottom">
                      <div>Invoice: <strong>#INV-00{selectedInvoice.id}</strong></div>
                      <div>Patient: <strong>{selectedInvoice.patientName}</strong></div>
                    </div>
                    
                    {/* Itemized Line Items */}
                    <div className="mb-2">
                      <div className="font-weight-bold text-secondary xsmall mb-1" style={{ letterSpacing: '0.5px' }}>PROCEDURES & SERVICES</div>
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        <div className="table-responsive border rounded bg-white p-1">
                          <table className="table table-sm table-borderless xsmall m-0">
                            <thead>
                              <tr className="border-bottom text-muted">
                                <th>Description</th>
                                <th className="text-end">Qty</th>
                                <th className="text-end">Price</th>
                                <th className="text-end">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedInvoice.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.description}</td>
                                  <td className="text-end">{item.quantity}</td>
                                  <td className="text-end">₱{item.unitPrice?.toFixed(2)}</td>
                                  <td className="text-end">₱{(item.unitPrice * item.quantity)?.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="xsmall text-muted italic">No items detailed in invoice.</div>
                      )}
                    </div>

                    {/* Financial summary: Subtotal, Discount, Tax, Grand Total */}
                    <div className="pt-2 border-top xsmall text-end text-secondary">
                      <div>Subtotal: <strong className="text-dark">₱{selectedInvoice.totalAmount?.toFixed(2)}</strong></div>
                      {selectedInvoice.discountAmount > 0 && (
                        <div>Discount: <strong className="text-danger">-₱{selectedInvoice.discountAmount?.toFixed(2)}</strong></div>
                      )}
                      {selectedInvoice.taxAmount > 0 && (
                        <div>Tax: <strong className="text-dark">+₱{selectedInvoice.taxAmount?.toFixed(2)}</strong></div>
                      )}
                      <div className="mt-1 font-weight-bold text-dark" style={{ fontSize: '13px' }}>
                        Grand Total: ₱{selectedInvoice.grandTotal?.toFixed(2)}
                      </div>
                      <div className="text-danger font-weight-bold">
                        Balance Due: ₱{selectedInvoice.balanceDue?.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small font-weight-bold">Payment Amount (₱)</label>
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
                      <option value="0">Cash</option>
                      <option value="1">Card</option>
                      <option value="2">Insurance</option>
                      <option value="3">Bank Transfer</option>
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
        </div>,
        document.body
      )}

      {/* View Invoice Details Modal */}
      {viewingInvoice && createPortal(
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-teal text-white border-0 py-3" style={{ backgroundColor: '#0D9488' }}>
                <h5 className="modal-title font-weight-bold text-white">Invoice Details (#INV-00{viewingInvoice.id})</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewingInvoice(null)}></button>
              </div>
              <div className="modal-body p-4 text-start">
                <div className="mb-3 p-2 bg-light rounded small">
                  <div className="mb-1"><strong>Patient Name:</strong> {viewingInvoice.patientName}</div>
                  <div className="mb-1"><strong>Invoice Date:</strong> {new Date(viewingInvoice.invoiceDate).toLocaleDateString()}</div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className="font-weight-bold" style={{ 
                      color: viewingInvoice.paymentStatus === 'Paid' || viewingInvoice.paymentStatus === 2 ? '#059669' :
                             viewingInvoice.paymentStatus === 'PartiallyPaid' || viewingInvoice.paymentStatus === 1 ? '#D97706' :
                             '#DC2626',
                      fontSize: '13px'
                    }}>
                      ● {viewingInvoice.paymentStatus === 0 ? 'Unpaid' : viewingInvoice.paymentStatus === 1 ? 'Partially Paid' : viewingInvoice.paymentStatus === 2 ? 'Paid' : viewingInvoice.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="font-weight-bold text-secondary xsmall mb-2" style={{ letterSpacing: '0.5px' }}>PROCEDURE ITEMIZATION</div>
                  <div className="table-responsive border rounded bg-white p-2">
                    <table className="table table-sm table-borderless xsmall m-0">
                      <thead>
                        <tr className="border-bottom text-muted">
                          <th>Description</th>
                          <th className="text-end">Qty</th>
                          <th className="text-end">Price</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingInvoice.items && viewingInvoice.items.length > 0 ? (
                          viewingInvoice.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.description}</td>
                              <td className="text-end">{item.quantity}</td>
                              <td className="text-end">₱{item.unitPrice?.toFixed(2)}</td>
                              <td className="text-end">₱{(item.unitPrice * item.quantity)?.toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted italic">No items detailed.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subtotals & Totals summary */}
                <div className="border-top pt-3 text-end text-secondary xsmall">
                  <div className="mb-1">Subtotal: <strong className="text-dark">₱{viewingInvoice.totalAmount?.toFixed(2)}</strong></div>
                  {viewingInvoice.discountAmount > 0 && (
                    <div className="mb-1">Discount: <strong className="text-danger">-₱{viewingInvoice.discountAmount?.toFixed(2)}</strong></div>
                  )}
                  {viewingInvoice.taxAmount > 0 && (
                    <div className="mb-1">Tax: <strong className="text-dark">+₱{viewingInvoice.taxAmount?.toFixed(2)}</strong></div>
                  )}
                  <h6 className="font-weight-bold mt-2 text-dark" style={{ fontSize: '13px' }}>
                    Grand Total: ₱{viewingInvoice.grandTotal?.toFixed(2)}
                  </h6>
                  <h6 className="font-weight-bold text-danger">
                    Balance Due: ₱{viewingInvoice.balanceDue?.toFixed(2)}
                  </h6>
                </div>
              </div>
              <div className="modal-footer border-0 p-3 bg-light">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setViewingInvoice(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Billing;
