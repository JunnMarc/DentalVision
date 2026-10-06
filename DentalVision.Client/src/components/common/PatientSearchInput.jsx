import React, { useState, useMemo } from 'react';
import { FaSearch, FaUser, FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

/**
 * Reusable Patient Search Selector
 * Supports multi-token filtering (e.g. "Amanda Sm"), code search, and phone matching.
 */
export const PatientSearchInput = ({
  patients = [],
  selectedPatient = null,
  onSelectPatient,
  onClear,
  placeholder = "Search by patient name, patient code (e.g. PAT-001), or phone..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients.slice(0, 10);
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
    return patients.filter(p => {
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const code = (p.patientCode || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const combined = `${fullName} ${code} ${phone} ${email}`;

      return tokens.every(token => combined.includes(token));
    }).slice(0, 15);
  }, [patients, searchTerm]);

  if (selectedPatient) {
    return (
      <div
        className="d-flex align-items-center justify-content-between p-3 rounded border"
        style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white"
            style={{ width: '40px', height: '40px', backgroundColor: '#16A34A' }}
          >
            <FaUser size={18} />
          </div>
          <div>
            <div className="font-weight-bold text-dark" style={{ fontSize: '14px' }}>
              {selectedPatient.firstName} {selectedPatient.lastName}
            </div>
            <div className="d-flex align-items-center gap-2 small text-muted">
              <span>ID: <strong className="text-dark">{selectedPatient.patientCode || `PAT-00${selectedPatient.id}`}</strong></span>
              <span>•</span>
              <span>{selectedPatient.phone || selectedPatient.email || 'No phone'}</span>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {selectedPatient.isProfileCompleted ? (
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
              <FaCheckCircle className="me-1" size={11} /> Profile Complete
            </span>
          ) : (
            <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
              <FaExclamationTriangle className="me-1" size={11} /> Intake Incomplete
            </span>
          )}
          {onClear && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                onClear();
              }}
              className="btn btn-sm btn-outline-secondary rounded-circle p-1 ms-2"
              title="Change patient"
              style={{ width: '28px', height: '28px' }}
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="position-relative">
      <div className="input-group shadow-sm">
        <span className="input-group-text bg-white border-end-0 text-muted">
          <FaSearch size={14} />
        </span>
        <input
          type="text"
          className="form-control border-start-0 ps-0"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          style={{ fontSize: '13.5px' }}
        />
        {searchTerm && (
          <button
            type="button"
            className="btn btn-outline-secondary border-start-0"
            onClick={() => setSearchTerm('')}
          >
            <FaTimes size={12} />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isFocused && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ zIndex: 1040 }}
            onClick={() => setIsFocused(false)}
          />
          <div
            className="position-absolute start-0 w-100 mt-1 bg-white rounded shadow-lg border overflow-hidden"
            style={{ zIndex: 1050, maxHeight: '240px', overflowY: 'auto' }}
          >
            {filteredPatients.length === 0 ? (
              <div className="p-3 text-center text-muted small">
                No matching patients found for "{searchTerm}"
              </div>
            ) : (
              filteredPatients.map(p => (
                <div
                  key={p.id}
                  className="p-2.5 px-3 border-bottom d-flex align-items-center justify-content-between hover-bg-light cursor-pointer"
                  style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectPatient(p);
                    setIsFocused(false);
                    setSearchTerm('');
                  }}
                >
                  <div>
                    <div className="font-weight-bold text-dark" style={{ fontSize: '13.5px' }}>
                      {p.firstName} {p.lastName}
                    </div>
                    <div className="xsmall text-muted">
                      {p.patientCode || `PAT-00${p.id}`} | {p.phone || p.email || 'No contact'}
                    </div>
                  </div>
                  <div>
                    {p.isProfileCompleted ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '10px' }}>
                        Complete
                      </span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle" style={{ fontSize: '10px' }}>
                        Intake Incomplete
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PatientSearchInput;
