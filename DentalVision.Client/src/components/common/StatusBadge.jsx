import React from 'react';

/**
 * StatusBadge Component
 * Standardized status indicators for Appointments, Intake, Payments, and Profiles.
 */
export const StatusBadge = ({ type = 'appointment', status, isIntakeCompleted, isProfileCompleted }) => {
  // 1. Appointment Status
  if (type === 'appointment') {
    const config = {
      0: { label: 'Scheduled', bg: '#EFF6FF', color: '#2563EB', border: '#DBEAFE', dot: '#3B82F6' },
      1: { label: 'Completed', bg: '#ECFDF5', color: '#059669', border: '#D1FAE5', dot: '#10B981' },
      2: { label: 'Cancelled', bg: '#FEF2F2', color: '#DC2626', border: '#FEE2E2', dot: '#EF4444' },
      3: { label: 'No Show', bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0', dot: '#94A3B8' },
      4: { label: 'Pending Confirmation', bg: '#FFFBEB', color: '#D97706', border: '#FEF3C7', dot: '#F59E0B' }
    };

    const current = config[status] || { label: 'Unknown', bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', dot: '#94A3B8' };

    return (
      <span
        className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill font-weight-bold"
        style={{
          fontSize: '12px',
          backgroundColor: current.bg,
          color: current.color,
          border: `1px solid ${current.border}`,
          letterSpacing: '0.01em'
        }}
      >
        <span
          className="rounded-circle me-1.5"
          style={{ width: '6px', height: '6px', backgroundColor: current.dot }}
        />
        {current.label}
      </span>
    );
  }

  // 2. Intake Status
  if (type === 'intake') {
    const isDone = isIntakeCompleted === true;
    return (
      <span
        className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill font-weight-bold"
        style={{
          fontSize: '12px',
          backgroundColor: isDone ? '#ECFDF5' : '#FFFBEB',
          color: isDone ? '#059669' : '#D97706',
          border: isDone ? '1px solid #D1FAE5' : '1px solid #FEF3C7'
        }}
      >
        <span className="me-1">{isDone ? '✓' : '●'}</span>
        {isDone ? 'Intake Complete' : 'Intake Pending'}
      </span>
    );
  }

  // 3. Profile Completeness Status
  if (type === 'profile') {
    const isDone = isProfileCompleted === true;
    return (
      <span
        className="d-inline-flex align-items-center px-2 py-0.5 rounded-pill font-weight-bold"
        style={{
          fontSize: '11px',
          backgroundColor: isDone ? '#ECFDF5' : '#FEF3C7',
          color: isDone ? '#047857' : '#B45309',
          border: isDone ? '1px solid #A7F3D0' : '1px solid #FDE68A'
        }}
      >
        {isDone ? '✓ Profile Complete' : '⚠ Intake Incomplete'}
      </span>
    );
  }

  // 4. Payment / Billing Status
  if (type === 'payment') {
    const isPaid = status === 'Paid' || status === 2;
    const isPartial = status === 'PartiallyPaid' || status === 1;
    return (
      <span
        className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill font-weight-bold"
        style={{
          fontSize: '12px',
          backgroundColor: isPaid ? '#ECFDF5' : isPartial ? '#FFFBEB' : '#FEF2F2',
          color: isPaid ? '#059669' : isPartial ? '#D97706' : '#DC2626',
          border: isPaid ? '1px solid #D1FAE5' : isPartial ? '1px solid #FEF3C7' : '1px solid #FEE2E2'
        }}
      >
        ● {isPaid ? 'Paid' : isPartial ? 'Partially Paid' : 'Unpaid'}
      </span>
    );
  }

  return null;
};

export default StatusBadge;
