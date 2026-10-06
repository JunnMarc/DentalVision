import React from 'react';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaVenusMars } from 'react-icons/fa';

export const ProfileSummaryCard = ({ profile }) => {
  if (!profile) return null;

  const formattedDob = () => {
    if (!profile.dateOfBirth) return "Not provided yet";
    const dob = new Date(profile.dateOfBirth);
    if (dob.getFullYear() === 2000 && dob.getMonth() === 0 && dob.getDate() === 1) {
      return "Not provided yet";
    }
    return dob.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="card shadow-sm border-0 mb-4 overflow-hidden" style={{ borderRadius: '16px' }}>
      {/* Gradient Header */}
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
          <h5 className="mb-0 font-weight-bold text-white">{profile.firstName} {profile.lastName}</h5>
          <span className="badge bg-light text-dark font-weight-bold xsmall mt-1 px-2 py-1">
            ID: {profile.patientCode || `PAT-00${profile.id}`}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="card-body p-4 bg-white text-start">
        <div className="row g-3">
          <div className="col-6">
            <div className="text-muted xsmall font-weight-bold d-flex align-items-center gap-1">
              <FaCalendarAlt size={10} /> DATE OF BIRTH
            </div>
            <div className="small font-weight-bold" style={{ color: '#1E293B' }}>
              {formattedDob()}
            </div>
          </div>
          <div className="col-6">
            <div className="text-muted xsmall font-weight-bold d-flex align-items-center gap-1">
              <FaVenusMars size={10} /> GENDER
            </div>
            <div className="small font-weight-bold" style={{ color: '#1E293B' }}>
              {profile.gender || 'Not provided yet'}
            </div>
          </div>
          <div className="col-12 border-top pt-2">
            <div className="text-muted xsmall font-weight-bold d-flex align-items-center gap-1">
              <FaPhone size={10} /> CONTACT NUMBER
            </div>
            <div className="small font-weight-bold" style={{ color: '#1E293B' }}>
              {profile.phone === '0000000000' || !profile.phone ? 'Not provided yet' : profile.phone}
            </div>
          </div>
          <div className="col-12 border-top pt-2">
            <div className="text-muted xsmall font-weight-bold d-flex align-items-center gap-1">
              <FaEnvelope size={10} /> EMAIL ADDRESS
            </div>
            <div className="small font-weight-bold" style={{ color: '#1E293B' }}>
              {profile.email}
            </div>
          </div>
          <div className="col-12 border-top pt-2">
            <div className="text-muted xsmall font-weight-bold d-flex align-items-center gap-1">
              <FaMapMarkerAlt size={10} /> HOME ADDRESS
            </div>
            <div className="small text-muted">
              {profile.address || 'Not provided yet'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummaryCard;
