import React, { useState, useEffect } from 'react';
import { FaCalendarPlus, FaUserPlus, FaNotesMedical, FaCheck, FaTimes, FaUserCheck } from 'react-icons/fa';
import api from '../../services/api';
import Modal from '../common/Modal';
import PatientSearchInput from '../common/PatientSearchInput';

export const QuickBookModal = ({
  isOpen,
  onClose,
  onSuccess,
  dentists = [],
  patients = [],
  initialDate = ''
}) => {
  const [bookingStep, setBookingStep] = useState(1);
  const [patientMode, setPatientMode] = useState('new'); // 'new' | 'existing'
  const [selectedExistingPatient, setSelectedExistingPatient] = useState(null);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [createdPatientId, setCreatedPatientId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    appointmentDate: initialDate || new Date().toISOString().split('T')[0],
    appointmentTime: '09:00',
    dentistId: dentists[0]?.id || 3,
    reason: 'Routine Dental Checkup & Prophylaxis',
    notes: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    medicalHistory: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  useEffect(() => {
    if (isOpen) {
      setBookingStep(1);
      setPatientMode('new');
      setSelectedExistingPatient(null);
      setCreatedAppointment(null);
      setCreatedPatientId(null);
      setErrorMessage('');
      setFormData({
        appointmentDate: initialDate || new Date().toISOString().split('T')[0],
        appointmentTime: '09:00',
        dentistId: dentists[0]?.id || 3,
        reason: 'Routine Dental Checkup & Prophylaxis',
        notes: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        gender: 'Male',
        address: '',
        medicalHistory: '',
        allergies: '',
        emergencyContactName: '',
        emergencyContactPhone: ''
      });
    }
  }, [isOpen, initialDate, dentists]);

  const handleQuickBookSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const datetime = `${formData.appointmentDate}T${formData.appointmentTime}:00`;
      const payload = {
        existingPatientId: patientMode === 'existing' && selectedExistingPatient ? selectedExistingPatient.id : null,
        firstName: patientMode === 'new' ? formData.firstName : null,
        lastName: patientMode === 'new' ? formData.lastName : null,
        phone: patientMode === 'new' ? formData.phone : null,
        email: patientMode === 'new' ? formData.email : null,
        dentistId: parseInt(formData.dentistId),
        appointmentDate: datetime,
        reason: formData.reason,
        notes: formData.notes
      };

      const res = await api.post('/appointments/quick-book', payload);
      const newAppt = res.data;
      setCreatedAppointment(newAppt);
      setCreatedPatientId(newAppt.patientId);

      if (onSuccess) onSuccess(newAppt);

      // Advance to step 3 (Subsequent Clinical Intake)
      if (patientMode === 'new') {
        setBookingStep(3);
      } else {
        if (selectedExistingPatient && !selectedExistingPatient.isProfileCompleted) {
          setBookingStep(3);
        } else {
          onClose();
        }
      }
    } catch (err) {
      console.error("Error during quick book:", err);
      setErrorMessage(err.response?.data?.message || "Failed to book appointment. Please verify details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteProfileSubmit = async (e) => {
    e.preventDefault();
    if (!createdPatientId) return;
    setSubmitting(true);

    try {
      const profilePayload = {
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : null,
        gender: formData.gender,
        address: formData.address,
        medicalHistory: formData.medicalHistory,
        allergies: formData.allergies,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone
      };

      await api.put(`/patients/${createdPatientId}/complete-profile`, profilePayload);

      if (createdAppointment) {
        await api.put(`/appointments/${createdAppointment.id}/intake`, {
          isIntakeCompleted: true,
          intakeNotes: "Intake completed during appointment reservation."
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error completing intake profile:", err);
      setErrorMessage("Could not save profile details, but appointment slot was successfully reserved.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Dental Appointment"
      subtitle="Fast 3-step progressive reservation & medical intake workflow"
      icon={FaCalendarPlus}
      size="lg"
    >
      {/* Wizard Progress Steps */}
      <div className="d-flex align-items-center justify-content-between mb-4 px-2">
        <div className={`d-flex align-items-center gap-2 ${bookingStep >= 1 ? 'text-primary font-weight-bold' : 'text-muted'}`}>
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center text-white ${bookingStep >= 1 ? 'bg-primary' : 'bg-secondary'}`}
            style={{ width: '28px', height: '28px', fontSize: '13px' }}
          >
            1
          </div>
          <span className="small">Schedule & Clinician</span>
        </div>
        <div className="flex-grow-1 border-top mx-2" style={{ borderColor: '#E2E8F0' }} />
        <div className={`d-flex align-items-center gap-2 ${bookingStep >= 2 ? 'text-primary font-weight-bold' : 'text-muted'}`}>
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center text-white ${bookingStep >= 2 ? 'bg-primary' : 'bg-secondary'}`}
            style={{ width: '28px', height: '28px', fontSize: '13px' }}
          >
            2
          </div>
          <span className="small">Patient Contact</span>
        </div>
        <div className="flex-grow-1 border-top mx-2" style={{ borderColor: '#E2E8F0' }} />
        <div className={`d-flex align-items-center gap-2 ${bookingStep >= 3 ? 'text-success font-weight-bold' : 'text-muted'}`}>
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center text-white ${bookingStep >= 3 ? 'bg-success' : 'bg-secondary'}`}
            style={{ width: '28px', height: '28px', fontSize: '13px' }}
          >
            3
          </div>
          <span className="small">Health Intake</span>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger py-2 small mb-3">
          {errorMessage}
        </div>
      )}

      {/* STEP 1: Schedule & Reason */}
      {bookingStep === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setBookingStep(2); }}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Appointment Date <span className="text-danger">*</span></label>
              <input
                type="date"
                className="form-control"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Time Slot <span className="text-danger">*</span></label>
              <input
                type="time"
                className="form-control"
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">Assign Clinician / Dentist <span className="text-danger">*</span></label>
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
            <div className="col-12">
              <label className="form-label small font-weight-bold">Treatment Purpose / Reason <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Routine Dental Checkup, Cavity Filling, Plaque Screening"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">Internal Receptionist Notes</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Any special accommodations or patient requests..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="col-12 text-end mt-4">
              <button type="button" className="btn btn-outline-secondary me-2 px-3" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4 font-weight-bold">
                Next: Patient Details →
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: Patient Mode Selection & Quick Booking */}
      {bookingStep === 2 && (
        <form onSubmit={handleQuickBookSubmit}>
          <div className="mb-3">
            <div className="btn-group w-100 p-1 bg-light rounded" role="group">
              <button
                type="button"
                className={`btn btn-sm ${patientMode === 'new' ? 'btn-white bg-white shadow-sm font-weight-bold text-primary' : 'text-muted'}`}
                onClick={() => setPatientMode('new')}
              >
                <FaUserPlus className="me-1.5" /> Fast Quick-Register (New Patient)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${patientMode === 'existing' ? 'btn-white bg-white shadow-sm font-weight-bold text-primary' : 'text-muted'}`}
                onClick={() => setPatientMode('existing')}
              >
                <FaUserCheck className="me-1.5" /> Search Existing Patient
              </button>
            </div>
          </div>

          {patientMode === 'new' ? (
            <div className="row g-3 bg-light p-3 rounded border">
              <div className="col-md-6">
                <label className="form-label small font-weight-bold">First Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Amanda"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small font-weight-bold">Last Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Smith"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small font-weight-bold">Mobile Phone <span className="text-danger">*</span></label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="e.g. +1 555 0192"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small font-weight-bold">Email (Optional)</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. amanda.smith@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-light rounded border">
              <label className="form-label small font-weight-bold">Select Existing Patient <span className="text-danger">*</span></label>
              <PatientSearchInput
                patients={patients}
                selectedPatient={selectedExistingPatient}
                onSelectPatient={(p) => setSelectedExistingPatient(p)}
                onClear={() => setSelectedExistingPatient(null)}
              />
            </div>
          )}

          <div className="col-12 text-end mt-4">
            <button type="button" className="btn btn-outline-secondary me-2 px-3" onClick={() => setBookingStep(1)}>
              ← Back to Schedule
            </button>
            <button
              type="submit"
              disabled={submitting || (patientMode === 'existing' && !selectedExistingPatient)}
              className="btn btn-primary px-4 font-weight-bold"
            >
              {submitting ? 'Confirming Reservation...' : 'Confirm Appointment Slot →'}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Subsequent Health Profile Intake */}
      {bookingStep === 3 && (
        <form onSubmit={handleCompleteProfileSubmit}>
          <div className="p-3 mb-3 rounded border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <div className="d-flex align-items-center gap-2 text-success font-weight-bold small mb-1">
              <FaCheck /> Appointment Slot Successfully Reserved!
            </div>
            <p className="text-muted xsmall mb-0">
              Collect the patient's medical and emergency information below to complete their full clinical profile, or skip to finish later.
            </p>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Date of Birth</label>
              <input
                type="date"
                className="form-control"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Gender</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
                placeholder="e.g. 104 Maple Street, Apt 2B"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold text-danger">Known Drug / Latex Allergies</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Penicillin, Latex, Local Anesthetics (or None)"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Relevant Medical History</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Hypertension, Diabetes, Asthma"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Emergency Contact Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Robert Smith (Spouse)"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Emergency Contact Phone</label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. +1 555 9921"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
            </div>
            <div className="col-12 d-flex justify-content-between align-items-center mt-4 border-top pt-3">
              <button
                type="button"
                className="btn btn-link text-muted small p-0 text-decoration-none"
                onClick={onClose}
              >
                Skip & Complete Later
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-success px-4 font-weight-bold"
              >
                {submitting ? 'Saving Profile...' : 'Save & Complete Intake ✓'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default QuickBookModal;
