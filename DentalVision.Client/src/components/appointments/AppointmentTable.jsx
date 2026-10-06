import React from 'react';
import { FaUser, FaClock, FaCheck, FaExclamationTriangle, FaNotesMedical, FaStethoscope } from 'react-icons/fa';
import StatusBadge from '../common/StatusBadge';

export const AppointmentTable = ({
  appointments = [],
  onUpdateStatus,
  onOpenIntakeModal,
  onNavigateToValidation,
  isDentist = false,
  currentUserId = null
}) => {
  if (appointments.length === 0) {
    return (
      <div className="card shadow-sm border-0 p-5 text-center bg-white" style={{ borderRadius: '16px' }}>
        <div className="text-muted mb-2" style={{ fontSize: '36px' }}>📅</div>
        <h6 className="font-weight-bold text-dark">No appointments scheduled for this date</h6>
        <p className="text-muted small mb-0">Use the Quick Book button above to create a new appointment slot.</p>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 overflow-hidden bg-white" style={{ borderRadius: '16px' }}>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13.5px' }}>
          <thead className="table-light" style={{ backgroundColor: '#F8FAFC' }}>
            <tr>
              <th className="py-3 px-4">Time & Status</th>
              <th className="py-3">Patient Record</th>
              <th className="py-3">Assigned Clinician</th>
              <th className="py-3">Reason / Treatment</th>
              <th className="py-3 text-center">Intake Status</th>
              <th className="py-3 text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} className="border-bottom">
                {/* Time & Status */}
                <td className="py-3 px-4">
                  <div className="font-weight-bold text-dark d-flex align-items-center gap-1.5">
                    <FaClock size={12} className="text-primary" />
                    {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="mt-1">
                    <StatusBadge type="appointment" status={appt.status} />
                  </div>
                </td>

                {/* Patient Record */}
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2.5">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-primary"
                      style={{ width: '36px', height: '36px', backgroundColor: '#EFF6FF' }}
                    >
                      <FaUser size={14} />
                    </div>
                    <div>
                      <div className="font-weight-bold text-dark">
                        {appt.patientName}
                      </div>
                      <div className="xsmall text-muted">
                        {appt.patientCode || `PAT-00${appt.patientId}`}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Assigned Clinician */}
                <td className="py-3">
                  <div className="font-weight-bold text-dark small">
                    {appt.dentistName}
                  </div>
                </td>

                {/* Reason & Notes */}
                <td className="py-3">
                  <div className="font-weight-bold text-dark" style={{ maxWidth: '240px' }}>
                    {appt.reason || 'Routine Consultation'}
                  </div>
                  {appt.notes && (
                    <div className="xsmall text-muted text-truncate" style={{ maxWidth: '240px' }}>
                      {appt.notes}
                    </div>
                  )}
                </td>

                {/* Intake Status */}
                <td className="py-3 text-center">
                  <StatusBadge type="intake" isIntakeCompleted={appt.isIntakeCompleted} />
                </td>

                {/* Actions */}
                <td className="py-3 text-end px-4">
                  <div className="d-inline-flex align-items-center gap-1.5">
                    {/* Standalone Intake Trigger */}
                    {!appt.isIntakeCompleted && (
                      <button
                        type="button"
                        onClick={() => onOpenIntakeModal(appt)}
                        className="btn btn-sm btn-outline-warning text-dark px-2 py-1 font-weight-bold"
                        style={{ fontSize: '11.5px' }}
                        title="Complete Intake Checklist"
                      >
                        <FaNotesMedical className="me-1 text-warning" /> Complete Intake
                      </button>
                    )}

                    {/* Dentist Quick Validate */}
                    {appt.status === 0 && isDentist && (
                      <button
                        type="button"
                        onClick={() => onNavigateToValidation && onNavigateToValidation(appt)}
                        className="btn btn-sm btn-outline-primary px-2 py-1 font-weight-bold"
                        style={{ fontSize: '11.5px' }}
                        title="Open Clinical Validation"
                      >
                        <FaStethoscope className="me-1" /> Examine
                      </button>
                    )}

                    {/* Status Dropdown */}
                    <select
                      className="form-select form-select-sm d-inline-block w-auto"
                      style={{ fontSize: '12px', padding: '3px 24px 3px 8px' }}
                      value={appt.status}
                      onChange={(e) => onUpdateStatus(appt.id, parseInt(e.target.value))}
                    >
                      <option value="0">Scheduled</option>
                      <option value="1">Completed</option>
                      <option value="2">Cancelled</option>
                      <option value="3">No Show</option>
                      <option value="4">Pending Request</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentTable;
