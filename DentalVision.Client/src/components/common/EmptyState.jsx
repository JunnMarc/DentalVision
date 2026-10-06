import React from 'react';

export const EmptyState = ({
  icon: Icon,
  emoji = '📋',
  title = 'No records found',
  subtitle = 'There is currently no data to display.',
  actionText,
  onActionClick
}) => {
  return (
    <div className="card shadow-sm border-0 p-5 text-center bg-white" style={{ borderRadius: '16px' }}>
      <div className="mb-3">
        {Icon ? (
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center bg-light text-muted"
            style={{ width: '64px', height: '64px' }}
          >
            <Icon size={28} />
          </div>
        ) : (
          <div style={{ fontSize: '40px' }}>{emoji}</div>
        )}
      </div>
      <h6 className="font-weight-bold text-dark mb-1">{title}</h6>
      <p className="text-muted small mb-0" style={{ maxWidth: '380px', margin: '0 auto' }}>
        {subtitle}
      </p>
      {actionText && onActionClick && (
        <div className="mt-3">
          <button
            type="button"
            className="btn btn-sm btn-primary px-3 font-weight-bold"
            onClick={onActionClick}
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
