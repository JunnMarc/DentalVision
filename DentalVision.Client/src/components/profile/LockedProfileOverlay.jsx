import React from 'react';
import { FaUser, FaLock } from 'react-icons/fa';

export const LockedProfileOverlay = ({ profile }) => {
  return (
    <div
      className="card shadow-sm border-0 mb-4 position-relative overflow-hidden"
      style={{ borderRadius: '16px', minHeight: '350px' }}
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
            <h5 className="mb-0 font-weight-bold text-white">{profile?.firstName} {profile?.lastName}</h5>
            <span className="badge bg-light text-dark font-weight-bold xsmall mt-1 px-2 py-1">ID: PAT-XXXX</span>
          </div>
        </div>
        <div className="card-body p-4 bg-white text-start">
          <div className="row g-3">
            <div className="col-6">
              <div className="text-muted xsmall font-weight-bold">DATE OF BIRTH</div>
              <div className="small font-weight-bold">January 1, 2000</div>
            </div>
            <div className="col-6">
              <div className="text-muted xsmall font-weight-bold">GENDER</div>
              <div className="small font-weight-bold">Male</div>
            </div>
            <div className="col-12 border-top pt-2">
              <div className="text-muted xsmall font-weight-bold">CONTACT NUMBER</div>
              <div className="small font-weight-bold">+63 917 123 4567</div>
            </div>
            <div className="col-12 border-top pt-2">
              <div className="text-muted xsmall font-weight-bold">EMAIL ADDRESS</div>
              <div className="small font-weight-bold">{profile?.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Glass Overlay with Lock Message */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(3px)' }}
      >
        <div
          className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle shadow-sm"
          style={{ width: 70, height: 70, backgroundColor: '#FEF3C7', color: '#D97706' }}
        >
          <FaLock size={28} />
        </div>
        <h5 className="font-weight-bold text-dark mb-2">Clinical Details Locked</h5>
        <p className="text-muted small mb-0" style={{ maxWidth: '280px', lineHeight: '1.5' }}>
          Your medical records card unlocks automatically once clinic staff confirms your appointment schedule.
        </p>
      </div>
    </div>
  );
};

export default LockedProfileOverlay;
