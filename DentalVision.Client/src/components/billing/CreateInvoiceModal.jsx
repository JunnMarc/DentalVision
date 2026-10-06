import React, { useState, useEffect } from 'react';
import { FaFileInvoiceDollar, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../../services/api';
import Modal from '../common/Modal';
import PatientSearchInput from '../common/PatientSearchInput';

export const CreateInvoiceModal = ({
  isOpen,
  onClose,
  patients = [],
  onSuccess
}) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([{ serviceId: '', serviceName: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedPatient(null);
      setDiscountAmount(0);
      setNotes('');
      setErrorMessage('');
      setItems([{ serviceId: '', serviceName: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]);

      const loadServices = async () => {
        try {
          const res = await api.get('/services');
          setServices(res.data);
          if (res.data.length > 0) {
            setItems([{
              serviceId: res.data[0].id,
              serviceName: res.data[0].serviceName,
              quantity: 1,
              unitPrice: res.data[0].price,
              lineTotal: res.data[0].price
            }]);
          }
        } catch (err) {
          console.error("Error loading clinic services:", err);
        }
      };
      loadServices();
    }
  }, [isOpen]);

  const handleServiceChange = (index, serviceId) => {
    const s = services.find(x => String(x.id) === String(serviceId));
    const newItems = [...items];
    if (s) {
      newItems[index] = {
        ...newItems[index],
        serviceId: s.id,
        serviceName: s.serviceName,
        unitPrice: s.price,
        lineTotal: s.price * newItems[index].quantity
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        serviceId: '',
        serviceName: '',
        unitPrice: 0,
        lineTotal: 0
      };
    }
    setItems(newItems);
  };

  const handleQuantityChange = (index, qty) => {
    const val = Math.max(1, parseInt(qty) || 1);
    const newItems = [...items];
    newItems[index].quantity = val;
    newItems[index].lineTotal = val * newItems[index].unitPrice;
    setItems(newItems);
  };

  const addItemRow = () => {
    const defaultService = services[0];
    if (defaultService) {
      setItems([...items, {
        serviceId: defaultService.id,
        serviceName: defaultService.serviceName,
        quantity: 1,
        unitPrice: defaultService.price,
        lineTotal: defaultService.price
      }]);
    } else {
      setItems([...items, { serviceId: '', serviceName: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]);
    }
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  const tax = subtotal * 0.12; // 12% standard VAT
  const grandTotal = Math.max(0, subtotal + tax - parseFloat(discountAmount || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setErrorMessage("Please select a patient for this billing statement.");
      return;
    }
    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        patientId: selectedPatient.id,
        items: items.map(i => ({
          serviceId: parseInt(i.serviceId),
          quantity: parseInt(i.quantity),
          unitPrice: parseFloat(i.unitPrice)
        })),
        discountAmount: parseFloat(discountAmount || 0),
        notes: notes
      };

      await api.post('/billing/invoices', payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error generating invoice:", err);
      setErrorMessage(err.response?.data?.message || "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Clinical Invoice"
      subtitle="Generate dental treatment statements and itemized billing"
      icon={FaFileInvoiceDollar}
      size="lg"
    >
      {errorMessage && (
        <div className="alert alert-danger py-2 small mb-3">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Patient Selector */}
        <div className="mb-4">
          <label className="form-label small font-weight-bold">Select Billable Patient <span className="text-danger">*</span></label>
          <PatientSearchInput
            patients={patients}
            selectedPatient={selectedPatient}
            onSelectPatient={(p) => setSelectedPatient(p)}
            onClear={() => setSelectedPatient(null)}
          />
        </div>

        {/* Itemized Services Table */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label small font-weight-bold mb-0">Treatment & Service Line Items</label>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary px-2.5 py-0.5"
              style={{ fontSize: '12px' }}
              onClick={addItemRow}
            >
              <FaPlus className="me-1" size={10} /> Add Service
            </button>
          </div>

          <div className="table-responsive border rounded bg-light p-2">
            <table className="table table-sm table-borderless align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr className="text-muted small">
                  <th>Service / Treatment</th>
                  <th style={{ width: '80px' }}>Qty</th>
                  <th style={{ width: '120px' }}>Price (₱)</th>
                  <th style={{ width: '120px' }}>Total (₱)</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={item.serviceId}
                        onChange={(e) => handleServiceChange(idx, e.target.value)}
                        required
                      >
                        <option value="">Select Treatment...</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.serviceName} (₱{s.price.toFixed(2)})</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="form-control form-control-sm text-center"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm bg-white"
                        value={item.unitPrice}
                        disabled
                      />
                    </td>
                    <td className="font-weight-bold text-dark">
                      ₱{(item.lineTotal || 0).toFixed(2)}
                    </td>
                    <td>
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0"
                          onClick={() => removeItemRow(idx)}
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label small font-weight-bold">Invoice Notes / Payment Instructions</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="e.g. Payable via Cash, GCash, or Insurance claim..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <div className="bg-light p-3 rounded border text-start" style={{ fontSize: '13.5px' }}>
              <div className="d-flex justify-content-between mb-1.5">
                <span className="text-muted">Subtotal:</span>
                <span className="font-weight-bold">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5">
                <span className="text-muted">VAT (12%):</span>
                <span>₱{tax.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted">Discount (₱):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control form-control-sm text-end"
                  style={{ width: '100px' }}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
              <div className="d-flex justify-content-between border-top pt-2 font-weight-bold" style={{ fontSize: '15px' }}>
                <span className="text-dark">Grand Total:</span>
                <span className="text-primary">₱{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 text-end">
          <button type="button" className="btn btn-outline-secondary me-2 px-3" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary px-4 font-weight-bold"
          >
            {submitting ? 'Generating...' : 'Issue Invoice ✓'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateInvoiceModal;
