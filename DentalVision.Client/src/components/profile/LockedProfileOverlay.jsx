import React from 'react';
import { FaUser, FaLock, FaCalendarPlus, FaClock } from 'react-icons/fa';

export const LockedProfileOverlay = ({
  profile,
  hasPendingAppointment = false,
  onBookClick
}) => {
  return (
    <div
      className="card shadow-sm border-0 mb-4 position-relative overflow-hidden bg-white"
      style={{ borderRadius: '16px', minHeight: '380px' }}
    >
      {/* Blurred Mock Background */}
      <div style={{ filter: 'blur(5px)', opacity: 0.35, pointerEvents: 'none', userSelect: 'none' }}>
        <div
          className="p-4 text-white d-flex align-items-center"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
        >
          <div
            className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: '64px', height: '64px' }}
          >
            <FaUser size={30} />
          </div>
          <div className="ms-3 text-start">
            <h5 className="mb-0 font-weight-bold text-white">
              {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Patient Record'}
            </h5>
            <span className="badge bg-light text-dark font-weight-bold xsmall mt-1 px-2 py-1">
              {profile?.patientCode || 'PAT-XXXXX'}
            </span>
          </div>
        </div>
        <div className="card-body p-4 bg-white text-start">
          <div className="row g-3">
            <div className="col-6">
              <div className="text-muted xsmall font-weight-bold">DATE OF BIRTH</div>
              <div className="small font-weight-bold">To be completed during consultation</div>
            </div>
            <div className="col-6">
              <div className="text-muted xsmall font-weight-bold">GENDER</div>
              <div className="small font-weight-bold">To be completed</div>
            </div>
            <div className="col-12 border-top pt-2">
              <div className="text-muted xsmall font-weight-bold">CONTACT NUMBER</div>
              <div className="small font-weight-bold">{profile?.phone || 'To be completed'}</div>
            </div>
            <div className="col-12 border-top pt-2">
              <div className="text-muted xsmall font-weight-bold">EMAIL ADDRESS</div>
              <div className="small font-weight-bold">{profile?.email || 'patient@dentalvision.com'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Glass Overlay with Lock Guidance */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.88)', backdropFilter: 'blur(4px)' }}
      >
        <div
          className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle shadow-sm"
          style={{
            width: 64,
            height: 64,
            backgroundColor: hasPendingAppointment ? '#EFF6FF' : '#FEF3C7',
            color: hasPendingAppointment ? '#2563EB' : '#D97706'
          }}
        >
          {hasPendingAppointment ? <FaClock size={28} /> : <FaLock size={26} />}
        </div>

        <h5 className="font-weight-bold text-dark mb-1">
          {hasPendingAppointment ? 'Consultation Request Pending' : 'Booking Required First'}
        </h5>

        <p className="text-muted small mb-3" style={{ maxWidth: '300px', lineHeight: '1.5' }}>
          {hasPendingAppointment
            ? 'Your consultation request is awaiting clinic confirmation. Your personal profile and medical records card will unlock after confirmation.'
            : 'As a new patient, please book your first consultation slot. Personal details and medical records will be recorded during and after your visit.'}
        </p>

        {!hasPendingAppointment && onBookClick && (
          <button
            type="button"
            className="btn btn-primary btn-sm px-3.5 py-2 font-weight-bold shadow-sm d-flex align-items-center gap-2"
            onClick={onBookClick}
          >
            <FaCalendarPlus size={13} /> Book Consultation Now
          </button>
        )}
      </div>
    </div>
  );
};

export default LockedProfileOverlay;
