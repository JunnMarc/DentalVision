import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaCalendarPlus,
  FaSync,
  FaSearch,
  FaUserClock,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import useDentists from '../hooks/useDentists';
import usePatients from '../hooks/usePatients';
import useAppointments from '../hooks/useAppointments';
import QuickBookModal from '../components/appointments/QuickBookModal';
import AppointmentIntakeModal from '../components/appointments/AppointmentIntakeModal';
import AppointmentTable from '../components/appointments/AppointmentTable';

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const AppointmentCalendar = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  // Custom data hooks
  const { dentists } = useDentists();
  const { patients, refetch: refetchPatients } = usePatients();
  const {
    appointments,
    loading,
    selectedDate,
    setSelectedDate,
    refetch: refetchAppointments,
    updateStatus
  } = useAppointments(getTodayDateString());

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showQuickBookModal, setShowQuickBookModal] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [activeIntakeAppt, setActiveIntakeAppt] = useState(null);

  // Toast / Alert banner
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateStatus(id, newStatus);
      showNotification("Appointment status updated successfully.");
    } catch (err) {
      showNotification("Failed to update status.", "danger");
    }
  };

  const handleOpenIntakeModal = (appt) => {
    setActiveIntakeAppt(appt);
    setShowIntakeModal(true);
  };

  const handleNavigateToValidation = (appt) => {
    navigate('/plaque-validation', {
      state: {
        appointmentId: appt.id,
        patientId: appt.patientId,
        patientName: appt.patientName
      }
    });
  };

  // Filter appointments by patient search term
  const filteredAppointments = appointments.filter((appt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = (appt.patientName || '').toLowerCase();
    const dentist = (appt.dentistName || '').toLowerCase();
    const reason = (appt.reason || '').toLowerCase();
    const code = (appt.patientCode || '').toLowerCase();
    return name.includes(term) || dentist.includes(term) || reason.includes(term) || code.includes(term);
  });

  const pendingCount = appointments.filter(a => a.status === 4).length;

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

      {/* Header Bar */}
      <div className="card shadow-sm border-0 p-4 mb-4 bg-white" style={{ borderRadius: '16px' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h4 className="font-weight-bold text-dark mb-1 d-flex align-items-center gap-2">
              <FaCalendarAlt className="text-primary" /> Clinic Appointment Schedule
            </h4>
            <p className="text-muted small mb-0">
              Manage daily consultations, progressive patient intake workflows, and clinician assignments.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Date Picker Control */}
            <div className="input-group input-group-sm" style={{ width: 'auto' }}>
              <span className="input-group-text bg-light text-muted border-end-0">
                <FaCalendarAlt size={12} />
              </span>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ maxWidth: '140px' }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSelectedDate(getTodayDateString())}
              >
                Today
              </button>
            </div>

            {/* Refresh */}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-3"
              onClick={() => {
                refetchAppointments();
                refetchPatients();
              }}
              title="Refresh Appointments"
            >
              <FaSync size={11} className={loading ? 'fa-spin' : ''} /> Refresh
            </button>

            {/* Quick Book Action */}
            <button
              type="button"
              className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 px-3.5 py-1.5 font-weight-bold shadow-sm"
              onClick={() => setShowQuickBookModal(true)}
            >
              <FaCalendarPlus size={13} /> New Appointment (Quick Book)
            </button>
          </div>
        </div>

        {/* Pending Requests Alert Banner */}
        {pendingCount > 0 && (
          <div
            className="d-flex align-items-center justify-content-between p-3 rounded mt-3 border"
            style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
          >
            <div className="d-flex align-items-center gap-2 text-warning-emphasis">
              <FaUserClock size={16} className="text-warning" />
              <span className="small font-weight-bold">
                You have {pendingCount} patient booking request{pendingCount > 1 ? 's' : ''} awaiting clinic approval.
              </span>
            </div>
            <span className="badge bg-warning text-dark font-weight-bold">Action Needed</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="row g-2 mt-2 pt-2 border-top">
          <div className="col-md-6 col-lg-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <FaSearch size={12} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Filter by patient name, clinician, reason, or PAT code..."
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
          <div className="col-md-6 col-lg-7 text-md-end text-muted small d-flex align-items-center justify-content-md-end">
            <span>Showing <strong>{filteredAppointments.length}</strong> appointment{filteredAppointments.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Main Appointment Table View */}
      {loading ? (
        <div className="card shadow-sm border-0 p-5 text-center bg-white" style={{ borderRadius: '16px' }}>
          <div className="spinner-border text-primary mx-auto mb-2" role="status" />
          <div className="small text-muted">Loading appointments schedule...</div>
        </div>
      ) : (
        <AppointmentTable
          appointments={filteredAppointments}
          onUpdateStatus={handleUpdateStatus}
          onOpenIntakeModal={handleOpenIntakeModal}
          onNavigateToValidation={handleNavigateToValidation}
          isDentist={hasRole(['Dentist'])}
          currentUserId={user?.id}
        />
      )}

      {/* 3-Step Progressive Quick Booking Wizard Modal */}
      <QuickBookModal
        isOpen={showQuickBookModal}
        onClose={() => setShowQuickBookModal(false)}
        dentists={dentists}
        patients={patients}
        initialDate={selectedDate}
        onSuccess={() => {
          refetchAppointments();
          refetchPatients();
          showNotification("Appointment successfully reserved!");
        }}
      />

      {/* Standalone Clinical Check-In & Medical Intake Modal */}
      <AppointmentIntakeModal
        isOpen={showIntakeModal}
        onClose={() => {
          setShowIntakeModal(false);
          setActiveIntakeAppt(null);
        }}
        appointment={activeIntakeAppt}
        onSuccess={() => {
          refetchAppointments();
          refetchPatients();
          showNotification("Patient health intake & check-in successfully saved!");
        }}
      />
    </div>
  );
};

export default AppointmentCalendar;
