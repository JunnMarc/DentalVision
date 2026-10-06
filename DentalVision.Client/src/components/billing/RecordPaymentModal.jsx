import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCheck } from 'react-icons/fa';
import api from '../../services/api';
import Modal from '../common/Modal';

export const RecordPaymentModal = ({
  isOpen,
  onClose,
  invoice,
  onSuccess
}) => {
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && invoice) {
      setAmountPaid(invoice.balanceDue ? String(invoice.balanceDue) : '0');
      setPaymentMethod('Cash');
      setTransactionRef('');
      setErrorMessage('');
    }
  }, [isOpen, invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice) return;
    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        invoiceId: invoice.id,
        amountPaid: parseFloat(amountPaid),
        paymentMethod: paymentMethod,
        transactionReference: transactionRef || null
      };

      await api.post('/billing/payments', payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error recording payment:", err);
      setErrorMessage(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Patient Payment"
      subtitle={invoice ? `Invoice #INV-00${invoice.id} • Patient: ${invoice.patientName}` : ''}
      icon={FaMoneyBillWave}
      headerVariant="success"
      size="md"
    >
      {errorMessage && (
        <div className="alert alert-danger py-2 small mb-3">
          {errorMessage}
        </div>
      )}

      {invoice && (
        <form onSubmit={handleSubmit}>
          <div className="bg-light p-3 rounded mb-3 border text-start" style={{ fontSize: '13.5px' }}>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Total Invoice Amount:</span>
              <span className="font-weight-bold">₱{invoice.grandTotal?.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Current Balance Due:</span>
              <span className="font-weight-bold text-danger">₱{invoice.balanceDue?.toFixed(2)}</span>
            </div>
          </div>

          <div className="row g-3 text-start">
            <div className="col-12">
              <label className="form-label small font-weight-bold">Payment Method</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="GCash">GCash / Maya (e-Wallet)</option>
                <option value="CreditCard">Credit / Debit Card</option>
                <option value="BankTransfer">Direct Bank Transfer</option>
                <option value="Insurance">HMO / Dental Insurance</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label small font-weight-bold">Amount to Pay (₱) <span className="text-danger">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.balanceDue}
                className="form-control font-weight-bold text-primary"
                style={{ fontSize: '1.1rem' }}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label small font-weight-bold">Transaction Reference # (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. GCash Ref # 104829148"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />
            </div>

            <div className="col-12 text-end mt-4">
              <button type="button" className="btn btn-outline-secondary me-2 px-3" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-success px-4 font-weight-bold"
              >
                {submitting ? 'Processing...' : 'Confirm Payment ✓'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default RecordPaymentModal;
