import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children
}) => {
  return (
    <div className="card shadow-sm border-0 p-4 mb-4 bg-white text-start" style={{ borderRadius: '16px' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          {Icon && (
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-primary bg-primary-subtle shadow-sm flex-shrink-0"
              style={{ width: '48px', height: '48px' }}
            >
              <Icon size={24} />
            </div>
          )}
          <div>
            <h4 className="font-weight-bold text-dark mb-0.5" style={{ letterSpacing: '-0.02em' }}>
              {title}
            </h4>
            {subtitle && (
              <p className="text-muted small mb-0">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>
      {children && (
        <div className="mt-3 pt-3 border-top">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
