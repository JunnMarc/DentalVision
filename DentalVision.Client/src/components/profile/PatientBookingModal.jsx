import React, { useState } from 'react';
import { FaCalendarAlt, FaCheck } from 'react-icons/fa';
import api from '../../services/api';
import Modal from '../common/Modal';

export const PatientBookingModal = ({
  isOpen,
  onClose,
  profile,
  dentists = [],
  onSuccess
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    dentistId: dentists[0]?.id || 3,
    apptDate: '',
    apptTime: '09:00',
    apptReason: 'Routine Checkup & Prophylaxis',
    phone: profile?.phone === '0000000000' ? '' : (profile?.phone || '')
  });

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!profile) return;
    setSubmitting(true);
    setErrorMessage('');

    try {
      // Sync phone if provided
      const finalPhone = formData.phone || profile.phone;
      if (finalPhone && finalPhone !== profile.phone) {
        await api.post('/patients/my-profile', {
          firstName: profile.firstName,
          lastName: profile.lastName,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender || 'Male',
          phone: finalPhone,
          email: profile.email,
          address: profile.address || '',
          medicalHistory: profile.medicalHistory || ''
        });
      }

      const payload = {
        patientId: profile.id,
        dentistId: parseInt(formData.dentistId),
        appointmentDate: `${formData.apptDate}T${formData.apptTime}:00`,
        reason: formData.apptReason || 'Routine checkup',
        notes: 'Booked via Patient Self-Service Portal',
        status: 4 // Pending Request
      };

      await api.post('/appointments', payload);

      if (onSuccess) onSuccess();
      setShowConfirm(false);
      onClose();
    } catch (err) {
      console.error("Error submitting appointment request:", err);
      setErrorMessage(err.response?.data?.message || "Failed to submit booking request. Please check inputs.");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDentistName = dentists.find(d => String(d.id) === String(formData.dentistId))?.name || 'Selected Clinician';

  return (
    <>
      <Modal
        isOpen={isOpen && !showConfirm}
        onClose={onClose}
        title="Schedule Dental Consultation"
        subtitle="Request a date and clinician slot with our dental team"
        icon={FaCalendarAlt}
        size="md"
      >
        {errorMessage && (
          <div className="alert alert-danger py-2 small mb-3">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label small font-weight-bold">Select Clinician / Dentist</label>
              <select
                className="form-select"
                value={formData.dentistId}
                onChange={(e) => setFormData({ ...formData, dentistId: e.target.value })}
                required
              >
                {dentists.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Preferred Date</label>
              <input
                type="date"
                className="form-control"
                min={getTodayDateString()}
                value={formData.apptDate}
                onChange={(e) => setFormData({ ...formData, apptDate: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Preferred Time</label>
              <input
                type="time"
                className="form-control"
                value={formData.apptTime}
                onChange={(e) => setFormData({ ...formData, apptTime: e.target.value })}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label small font-weight-bold">Contact Phone Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. +63 917 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label small font-weight-bold">Reason for Visit</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Tooth sensitivity, regular cleaning, consultation"
                value={formData.apptReason}
                onChange={(e) => setFormData({ ...formData, apptReason: e.target.value })}
                required
              />
            </div>

            <div className="col-12 text-end mt-4">
              <button type="button" className="btn btn-outline-secondary me-2 px-3" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4 font-weight-bold">
                Review & Confirm →
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmation Step */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Appointment Request"
        subtitle="Please review your details before sending"
        icon={FaCheck}
        headerVariant="primary"
        size="md"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-outline-secondary px-3"
              onClick={() => setShowConfirm(false)}
            >
              Go Back & Edit
            </button>
            <button
              type="button"
              disabled={submitting}
              className="btn btn-primary px-4 font-weight-bold"
              onClick={handleConfirmSubmit}
            >
              {submitting ? 'Submitting...' : 'Yes, Submit Request ✓'}
            </button>
          </div>
        }
      >
        <div className="bg-light p-3 rounded border" style={{ fontSize: '13.5px' }}>
          <div className="mb-2"><strong>Clinician:</strong> {selectedDentistName}</div>
          <div className="mb-2"><strong>Date:</strong> {formData.apptDate}</div>
          <div className="mb-2"><strong>Time:</strong> {formData.apptTime}</div>
          <div className="mb-2"><strong>Contact Phone:</strong> {formData.phone || profile?.phone}</div>
          <div><strong>Reason:</strong> {formData.apptReason}</div>
        </div>
      </Modal>
    </>
  );
};

export default PatientBookingModal;
