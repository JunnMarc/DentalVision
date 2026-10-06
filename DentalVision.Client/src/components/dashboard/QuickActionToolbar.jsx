import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCamera,
  FaCalendarPlus,
  FaUserPlus,
  FaFileInvoiceDollar,
  FaFileMedicalAlt,
  FaUsers
} from 'react-icons/fa';

export const QuickActionToolbar = ({ hasRole, onQuickBookClick }) => {
  const navigate = useNavigate();

  return (
    <div className="card shadow-sm border-0 p-4 mb-4 bg-white" style={{ borderRadius: '16px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="font-weight-bold text-dark mb-0">Quick Action Shortcuts</h6>
        <span className="xsmall text-muted">Role-authorized tools</span>
      </div>
      <div className="d-flex flex-wrap gap-2">
        {hasRole(['Dentist', 'Dental Staff']) && (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 px-3 py-2 font-weight-bold"
            style={{ borderRadius: '10px' }}
            onClick={() => navigate('/upload-image')}
          >
            <FaCamera /> Upload Dental Scan (AI)
          </button>
        )}

        <button
          type="button"
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 px-3 py-2 font-weight-bold"
          style={{ borderRadius: '10px' }}
          onClick={() => {
            if (onQuickBookClick) onQuickBookClick();
            else navigate('/appointments');
          }}
        >
          <FaCalendarPlus /> Quick Book Appointment
        </button>

        {hasRole(['Dental Staff', 'Administrator']) && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 font-weight-bold"
            style={{ borderRadius: '10px' }}
            onClick={() => navigate('/patients')}
          >
            <FaUserPlus /> Register Patient
          </button>
        )}

        {hasRole(['Dental Staff', 'Administrator']) && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 font-weight-bold"
            style={{ borderRadius: '10px' }}
            onClick={() => navigate('/billing')}
          >
            <FaFileInvoiceDollar /> Create Invoice
          </button>
        )}

        {hasRole(['Dentist', 'Administrator']) && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 font-weight-bold"
            style={{ borderRadius: '10px' }}
            onClick={() => navigate('/clinical-reports')}
          >
            <FaFileMedicalAlt /> Clinical Reports
          </button>
        )}

        {hasRole(['Administrator']) && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 font-weight-bold"
            style={{ borderRadius: '10px' }}
            onClick={() => navigate('/users')}
          >
            <FaUsers /> Manage Staff
          </button>
        )}
      </div>
    </div>
  );
};

export default QuickActionToolbar;
