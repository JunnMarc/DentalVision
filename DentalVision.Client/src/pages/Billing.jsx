import React, { useState, useEffect } from 'react';
import {
  FaFileInvoiceDollar,
  FaPlus,
  FaSearch,
  FaMoneyBillWave,
  FaCheckCircle,
  FaExclamationCircle,
  FaEye,
  FaFilePdf
} from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import usePatients from '../hooks/usePatients';
import PageHeader from '../components/common/PageHeader';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import CreateInvoiceModal from '../components/billing/CreateInvoiceModal';
import RecordPaymentModal from '../components/billing/RecordPaymentModal';
import Modal from '../components/common/Modal';

export const Billing = () => {
  const { hasRole } = useAuth();
  const { patients } = usePatients();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/billing/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error("Error loading invoices:", err);
      // Fallback: try querying per patient
      try {
        let aggregated = [];
        for (let pId = 1; pId <= 5; pId++) {
          const r = await api.get(`/billing/invoices/patient/${pId}`);
          aggregated = [...aggregated, ...r.data];
        }
        setInvoices(aggregated);
      } catch (e) {
        console.error("Fallback invoice fetch failed:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const totalBilled = invoices.reduce((acc, i) => acc + (i.grandTotal || 0), 0);
  const totalBalanceDue = invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);
  const totalCollected = Math.max(0, totalBilled - totalBalanceDue);

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const idStr = `inv-00${inv.id}`.toLowerCase();
    const name = (inv.patientName || '').toLowerCase();
    return idStr.includes(term) || name.includes(term);
  });

  return (
    <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1440px' }}>
      {/* Toast Alert */}
      {toast && (
        <div
          className={`alert alert-${toast.type} shadow-sm border-0 d-flex align-items-center justify-content-between position-fixed top-0 end-0 m-4`}
          style={{ zIndex: 1100, minWidth: '320px', borderRadius: '12px' }}
        >
          <div className="d-flex align-items-center gap-2">
            {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span className="small font-weight-bold">{toast.message}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setToast(null)} />
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Billing, Invoicing & Payments"
        subtitle="Manage clinic treatment billing, payment receipts, and patient account balances."
        icon={FaFileInvoiceDollar}
        actions={
          hasRole(['Dental Staff', 'Administrator']) && (
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-1.5 px-3.5 py-2 font-weight-bold shadow-sm"
              onClick={() => setShowInvoiceModal(true)}
            >
              <FaPlus size={12} /> Issue New Invoice
            </button>
          )
        }
      />

      {/* KPI Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <MetricCard
            title="Total Billed Revenue"
            value={`₱${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle={`${invoices.length} invoices generated`}
            icon={FaFileInvoiceDollar}
            variant="primary"
          />
        </div>
        <div className="col-md-4">
          <MetricCard
            title="Total Payments Collected"
            value={`₱${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle="Verified transactions"
            icon={FaMoneyBillWave}
            variant="success"
          />
        </div>
        <div className="col-md-4">
          <MetricCard
            title="Outstanding Patient Balance"
            value={`₱${totalBalanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle="Pending collections"
            icon={FaExclamationCircle}
            variant="warning"
          />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card shadow-sm border-0 p-3 mb-3 bg-white" style={{ borderRadius: '16px' }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-6 col-lg-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <FaSearch size={12} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by invoice ID (e.g. INV-001) or patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="col-md-6 col-lg-8 text-md-end text-muted small">
            Showing <strong>{filteredInvoices.length}</strong> invoice statement{filteredInvoices.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card shadow-sm border-0 overflow-hidden bg-white" style={{ borderRadius: '16px' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mx-auto mb-2" role="status" />
            <div className="small text-muted">Loading billing statements...</div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-5 text-muted small">
            No matching invoice records found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13.5px' }}>
              <thead className="table-light" style={{ backgroundColor: '#F8FAFC' }}>
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Patient Name</th>
                  <th className="py-3">Total Amount</th>
                  <th className="py-3">Balance Due</th>
                  <th className="py-3">Payment Status</th>
                  <th className="py-3 text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-bottom">
                    <td className="py-3 px-4 font-weight-bold text-primary">
                      INV-00{inv.id}
                    </td>
                    <td className="py-3 text-muted">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-weight-bold text-dark">
                      {inv.patientName || `Patient #${inv.patientId}`}
                    </td>
                    <td className="py-3 font-weight-bold">
                      ₱{inv.grandTotal?.toFixed(2)}
                    </td>
                    <td className={`py-3 font-weight-bold ${inv.balanceDue > 0 ? 'text-danger' : 'text-success'}`}>
                      ₱{inv.balanceDue?.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <StatusBadge type="payment" status={inv.paymentStatus} />
                    </td>
                    <td className="py-3 text-end px-4">
                      <div className="d-inline-flex align-items-center gap-1.5">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary px-2.5 py-1"
                          style={{ fontSize: '12px' }}
                          onClick={() => setViewingInvoice(inv)}
                          title="View Invoice Breakdown"
                        >
                          <FaEye className="me-1" /> View
                        </button>

                        {inv.balanceDue > 0 && hasRole(['Dental Staff', 'Administrator']) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success px-2.5 py-1 font-weight-bold shadow-sm"
                            style={{ fontSize: '12px' }}
                            onClick={() => {
                              setSelectedInvoiceForPayment(inv);
                              setShowPaymentModal(true);
                            }}
                          >
                            <FaMoneyBillWave className="me-1" /> Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        patients={patients}
        onSuccess={() => {
          fetchInvoices();
          showNotification("Invoice statement successfully issued!");
        }}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedInvoiceForPayment(null);
        }}
        invoice={selectedInvoiceForPayment}
        onSuccess={() => {
          fetchInvoices();
          showNotification("Payment transaction recorded successfully!");
        }}
      />

      {/* View Invoice Statement Modal */}
      <Modal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title={viewingInvoice ? `Invoice #INV-00${viewingInvoice.id}` : ''}
        subtitle="Clinical Treatment Statement"
        icon={FaFileInvoiceDollar}
        size="lg"
      >
        {viewingInvoice && (
          <div className="text-start">
            <div className="d-flex justify-content-between align-items-start p-3 bg-light rounded mb-3 border">
              <div>
                <strong className="text-dark" style={{ fontSize: '15px' }}>{viewingInvoice.patientName}</strong>
                <div className="small text-muted">Date: {new Date(viewingInvoice.invoiceDate).toLocaleString()}</div>
              </div>
              <StatusBadge type="payment" status={viewingInvoice.paymentStatus} />
            </div>

            <div className="table-responsive mb-3 border rounded">
              <table className="table table-sm mb-0 align-middle" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr>
                    <th className="p-2.5">Service Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-end">Price</th>
                    <th className="p-2.5 text-end">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewingInvoice.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">{item.serviceName || item.description || `Treatment Item #${item.serviceId}`}</td>
                      <td className="p-2.5 text-center">{item.quantity}</td>
                      <td className="p-2.5 text-end">₱{item.unitPrice?.toFixed(2)}</td>
                      <td className="p-2.5 text-end font-weight-bold">₱{item.lineTotal?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row g-3">
              <div className="col-6">
                {viewingInvoice.notes && (
                  <div className="p-3 bg-light rounded text-muted small">
                    <strong>Notes:</strong> {viewingInvoice.notes}
                  </div>
                )}
              </div>
              <div className="col-6 text-end">
                <div className="small text-muted mb-1">Subtotal: <strong>₱{viewingInvoice.totalAmount?.toFixed(2)}</strong></div>
                {viewingInvoice.discountAmount > 0 && (
                  <div className="small text-danger mb-1">Discount: <strong>-₱{viewingInvoice.discountAmount?.toFixed(2)}</strong></div>
                )}
                <div className="font-weight-bold text-dark mb-1" style={{ fontSize: '16px' }}>
                  Grand Total: <span className="text-primary">₱{viewingInvoice.grandTotal?.toFixed(2)}</span>
                </div>
                <div className="font-weight-bold text-danger">
                  Balance Due: ₱{viewingInvoice.balanceDue?.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="text-end mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn btn-outline-secondary px-3"
                onClick={() => setViewingInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Billing;
