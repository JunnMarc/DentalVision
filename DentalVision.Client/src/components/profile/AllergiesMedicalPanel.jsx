import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

export const AllergiesMedicalPanel = ({
  medicalHistory = '',
  allergies = '',
  isEditable = false,
  onEditClick
}) => {
  const content = allergies || medicalHistory;

  return (
    <div
      className="card shadow-sm border-0 overflow-hidden mb-4"
      style={{ borderRadius: '16px', borderLeft: '6px solid #EF4444' }}
    >
      <div className="card-header bg-white border-0 pt-3 pb-0 px-4 d-flex justify-content-between align-items-center">
        <h6 className="font-weight-bold text-danger d-flex align-items-center mb-0">
          <FaExclamationTriangle size={18} className="me-2" /> Allergies & Medical Warnings
        </h6>
        {isEditable && onEditClick && (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger px-2.5 py-0.5"
            style={{ fontSize: '11px' }}
            onClick={onEditClick}
          >
            Update
          </button>
        )}
      </div>
      <div className="card-body px-4 pb-4 pt-3 text-start">
        <div
          className="p-3 rounded"
          style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', color: '#991B1B' }}
        >
          <p className="small mb-0 font-weight-bold" style={{ whiteSpace: 'pre-line' }}>
            {content || "No declared allergies or medical conditions on file (Update with clinic receptionist)."}
          </p>
        </div>
        <p className="text-muted xsmall mt-2 mb-0">
          * Note: This clinical warning card is highlighted in red across all clinician portals to prevent adverse medication interactions.
        </p>
      </div>
    </div>
  );
};

export default AllergiesMedicalPanel;
