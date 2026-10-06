import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaUser } from 'react-icons/fa';
import StatusBadge from '../common/StatusBadge';

export const RecentAppointmentsList = ({ appointments = [], loading = false }) => {
  return (
    <div className="card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
      <div className="card-header bg-white border-0 p-4 pb-2 d-flex justify-content-between align-items-center">
        <h5 className="font-weight-bold text-dark mb-0 d-flex align-items-center gap-2">
          <FaCalendarAlt className="text-primary" /> Today's Consultation Schedule
        </h5>
        <Link to="/appointments" className="btn btn-sm btn-link text-primary text-decoration-none p-0 font-weight-bold">
          View All →
        </Link>
      </div>
      <div className="card-body p-4 pt-2 text-start">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" role="status" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-4 text-muted small bg-light rounded">
            No consultations scheduled for today.
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {appointments.slice(0, 6).map((appt) => (
              <div
                key={appt.id}
                className="list-group-item px-0 py-3 border-bottom d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-primary bg-primary-subtle"
                    style={{ width: '38px', height: '38px' }}
                  >
                    <FaUser size={14} />
                  </div>
                  <div>
                    <div className="font-weight-bold text-dark small">
                      {appt.patientName}
                    </div>
                    <div className="xsmall text-muted d-flex align-items-center gap-2">
                      <span><FaClock size={10} /> {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>Dr. {appt.dentistName?.replace('Dr. ', '')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <StatusBadge type="appointment" status={appt.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentAppointmentsList;
