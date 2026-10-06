import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaExclamationCircle,
  FaPlus,
  FaEdit
} from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useDentists from '../hooks/useDentists';
import ProfileSummaryCard from '../components/profile/ProfileSummaryCard';
import AllergiesMedicalPanel from '../components/profile/AllergiesMedicalPanel';
import LockedProfileOverlay from '../components/profile/LockedProfileOverlay';
import PatientBookingModal from '../components/profile/PatientBookingModal';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

export const MyProfile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { dentists } = useDentists();

  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Edit Profile Form State
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    medicalHistory: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/patients/my-profile');
      const p = profileRes.data;
      setProfile(p);

      setEditFormData({
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
        gender: p.gender || 'Male',
        phone: p.phone === '0000000000' ? '' : (p.phone || ''),
        email: p.email || '',
        address: p.address || '',
        medicalHistory: p.medicalHistory || '',
        allergies: p.allergies || '',
        emergencyContactName: p.emergencyContactName || '',
        emergencyContactPhone: p.emergencyContactPhone || ''
      });

      // Load patient appointments & invoices in parallel using targeted endpoints
      if (p.id) {
        const [apptsRes, invsRes] = await Promise.allSettled([
          api.get(`/appointments/patient/${p.id}`).catch(() => api.get('/appointments/my-appointments')),
          api.get(`/billing/invoices/patient/${p.id}`).catch(() => api.get('/billing/invoices'))
        ]);

        if (apptsRes.status === 'fulfilled' && apptsRes.value?.data) {
          const list = Array.isArray(apptsRes.value.data) ? apptsRes.value.data : [];
          setAppointments(list.filter(a => a.patientId === p.id || !a.patientId));
        }

        if (invsRes.status === 'fulfilled' && invsRes.value?.data) {
          const list = Array.isArray(invsRes.value.data) ? invsRes.value.data : [];
          setInvoices(list.filter(i => i.patientId === p.id || !i.patientId));
        }
      }
    } catch (err) {
      console.error("Error loading patient portal profile:", err);
      showNotification("Could not load patient details. Please log in again.", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patients/my-profile', editFormData);
      await fetchProfileData();
      setShowEditProfileModal(false);
      showNotification("Profile details updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      showNotification("Failed to update profile.", "danger");
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary mx-auto mb-3" role="status" />
        <p className="text-muted small">Loading your patient record portal...</p>
      </div>
    );
  }

  // Check appointment confirmation status
  const hasConfirmedAppointment = appointments.some(a => a.status === 0 || a.status === 1);
  const hasAnyAppointment = appointments.length > 0;

  return (
    <div className="container-fluid p-0 animate-fade-in" style={{ maxWidth: '1320px' }}>
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

      {/* Top Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="font-weight-bold text-dark mb-0">Patient Health & Records Portal</h4>
          <p className="text-muted small mb-0">Welcome back, {profile?.firstName}! Review your dental care plan and appointments.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5 px-3"
            onClick={() => setShowEditProfileModal(true)}
          >
            <FaEdit size={12} /> Edit Profile
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 px-3.5 font-weight-bold shadow-sm"
            onClick={() => setShowBookingModal(true)}
          >
            <FaCalendarAlt size={12} /> Book Consultation
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="row g-4">
        {/* Left Column: Clinical Profile Card & Allergies Warnings */}
        <div className="col-lg-5">
          {hasAnyAppointment && !hasConfirmedAppointment ? (
            <LockedProfileOverlay profile={profile} />
          ) : (
            <>
              <ProfileSummaryCard profile={profile} />
              <AllergiesMedicalPanel
                allergies={profile?.allergies}
                medicalHistory={profile?.medicalHistory}
                isEditable={true}
                onEditClick={() => setShowEditProfileModal(true)}
              />
            </>
          )}
        </div>

        {/* Right Column: Appointments & Billing History */}
        <div className="col-lg-7">
          {/* Appointments Card */}
          <div className="card shadow-sm border-0 p-4 mb-4 bg-white" style={{ borderRadius: '16px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="font-weight-bold text-dark mb-0 d-flex align-items-center gap-2">
                <FaCalendarAlt className="text-primary" /> My Scheduled Appointments
              </h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary px-3 rounded-pill"
                onClick={() => setShowBookingModal(true)}
              >
                + New Slot
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-4 bg-light rounded text-muted small">
                No appointment records found. Click <strong>Book Consultation</strong> above to request a slot!
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Date & Time</th>
                      <th>Reason / Care</th>
                      <th>Clinician</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td className="font-weight-bold">
                          {new Date(appt.appointmentDate).toLocaleDateString()} at{' '}
                          {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>{appt.reason || 'Routine Checkup'}</td>
                        <td className="small text-muted">{appt.dentistName}</td>
                        <td>
                          <StatusBadge type="appointment" status={appt.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Billing & Invoices Card */}
          <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: '16px' }}>
            <h5 className="font-weight-bold text-dark mb-3 d-flex align-items-center gap-2">
              <FaFileInvoiceDollar className="text-primary" /> My Billing Invoices
            </h5>

            {invoices.length === 0 ? (
              <div className="text-center py-4 bg-light rounded text-muted small">
                No billing statements issued yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Invoice ID</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Balance Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="font-weight-bold text-primary">INV-00{inv.id}</td>
                        <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                        <td className="font-weight-bold">₱{inv.grandTotal.toFixed(2)}</td>
                        <td className={`font-weight-bold ${inv.balanceDue > 0 ? 'text-danger' : 'text-success'}`}>
                          ₱{inv.balanceDue.toFixed(2)}
                        </td>
                        <td>
                          <StatusBadge type="payment" status={inv.paymentStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Self-Service Booking Modal */}
      <PatientBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        profile={profile}
        dentists={dentists}
        onSuccess={() => {
          fetchProfileData();
          showNotification("Appointment request submitted! Clinic staff will confirm your slot shortly.");
        }}
      />

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        title="Update Personal & Medical Information"
        subtitle="Keep your contact and emergency details accurate for clinic safety"
        icon={FaUser}
        size="lg"
      >
        <form onSubmit={handleEditProfileSubmit}>
          <div className="row g-3 text-start">
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">First Name</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Date of Birth</label>
              <input
                type="date"
                className="form-control"
                value={editFormData.dateOfBirth}
                onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Gender</label>
              <select
                className="form-select"
                value={editFormData.gender}
                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={editFormData.email}
                disabled
              />
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">Residential Address</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold text-danger">Known Allergies (Medications / Latex)</label>
              <input
                type="text"
                className="form-control border-danger-subtle"
                value={editFormData.allergies}
                onChange={(e) => setEditFormData({ ...editFormData, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Latex"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Medical History</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.medicalHistory}
                onChange={(e) => setEditFormData({ ...editFormData, medicalHistory: e.target.value })}
                placeholder="e.g. Hypertension, Asthma"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Emergency Contact Name</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.emergencyContactName}
                onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Emergency Contact Phone</label>
              <input
                type="tel"
                className="form-control"
                value={editFormData.emergencyContactPhone}
                onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
              />
            </div>
            <div className="col-12 text-end mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary me-2 px-3"
                onClick={() => setShowEditProfileModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4 font-weight-bold">
                Save Changes ✓
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyProfile;
