import React, { useState, useEffect } from 'react';
import { FaNotesMedical, FaCheck, FaExclamationTriangle, FaUserCheck } from 'react-icons/fa';
import api from '../../services/api';
import Modal from '../common/Modal';

export const AppointmentIntakeModal = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    medicalHistory: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    intakeNotes: ''
  });

  useEffect(() => {
    if (isOpen && appointment?.patientId) {
      const loadPatient = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/patients/${appointment.patientId}`);
          const p = res.data;
          setPatient(p);
          setFormData({
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
            gender: p.gender || 'Male',
            address: p.address || '',
            medicalHistory: p.medicalHistory || '',
            allergies: p.allergies || '',
            emergencyContactName: p.emergencyContactName || '',
            emergencyContactPhone: p.emergencyContactPhone || '',
            intakeNotes: appointment.intakeNotes || ''
          });
        } catch (err) {
          console.error("Error loading patient for intake modal:", err);
          setErrorMessage("Failed to load patient record details.");
        } finally {
          setLoading(false);
        }
      };
      loadPatient();
    }
  }, [isOpen, appointment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appointment?.patientId) return;
    setSubmitting(true);
    setErrorMessage('');

    try {
      const profilePayload = {
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender,
        address: formData.address,
        medicalHistory: formData.medicalHistory,
        allergies: formData.allergies,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone
      };

      await api.put(`/patients/${appointment.patientId}/complete-profile`, profilePayload);

      await api.put(`/appointments/${appointment.id}/intake`, {
        isIntakeCompleted: true,
        intakeNotes: formData.intakeNotes || "Clinical check-in & intake questionnaire verified by reception."
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error saving intake:", err);
      setErrorMessage(err.response?.data?.message || "Failed to update intake. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clinic Check-In & Medical Intake"
      subtitle={patient ? `Patient: ${patient.firstName} ${patient.lastName} (${patient.patientCode || 'PAT'})` : 'Loading...'}
      icon={FaNotesMedical}
      headerVariant="success"
      size="lg"
    >
      {errorMessage && (
        <div className="alert alert-danger py-2 small mb-3">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status" />
          <p className="small text-muted mt-2">Loading patient profile...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="p-3 mb-3 rounded border" style={{ backgroundColor: '#F8FAFC' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <strong className="text-dark" style={{ fontSize: '14px' }}>
                  {patient?.firstName} {patient?.lastName}
                </strong>
                <div className="xsmall text-muted">
                  Appointment: {appointment ? new Date(appointment.appointmentDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''} | Reason: {appointment?.reason}
                </div>
              </div>
              <span className={`badge ${patient?.isProfileCompleted ? 'bg-success' : 'bg-warning text-dark'}`}>
                {patient?.isProfileCompleted ? 'Profile Complete' : 'Profile Incomplete'}
              </span>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Date of Birth <span className="text-danger">*</span></label>
              <input
                type="date"
                className="form-control"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Gender <span className="text-danger">*</span></label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">Residential Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 202 Green Street, Suite 4A"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold text-danger">
                Drug / Latex / Anesthesia Allergies <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control border-danger-subtle"
                placeholder="e.g. Penicillin, Latex, Local Anesthetics (or None)"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Medical History & Chronic Conditions</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Hypertension, Diabetes, Asthma"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Emergency Contact Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Maria Smith (Mother)"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Emergency Contact Phone <span className="text-danger">*</span></label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. +1 555 8823"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">Reception Check-in / Vitals Notes</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Notes on current symptoms, pain scale, vitals..."
                value={formData.intakeNotes}
                onChange={(e) => setFormData({ ...formData, intakeNotes: e.target.value })}
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
                {submitting ? 'Updating...' : 'Save & Check-in Patient ✓'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AppointmentIntakeModal;
