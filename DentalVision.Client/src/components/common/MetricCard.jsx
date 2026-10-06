import React from 'react';

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  onClick
}) => {
  const variantStyles = {
    primary: { bg: '#EFF6FF', color: '#2563EB', border: '#DBEAFE' },
    success: { bg: '#ECFDF5', color: '#059669', border: '#D1FAE5' },
    warning: { bg: '#FFFBEB', color: '#D97706', border: '#FEF3C7' },
    danger: { bg: '#FEF2F2', color: '#DC2626', border: '#FEE2E2' },
    info: { bg: '#F0FDF4', color: '#0D9488', border: '#CCFBF1' },
    purple: { bg: '#F5F3FF', color: '#7C3AED', border: '#EDE9FE' }
  };

  const style = variantStyles[variant] || variantStyles.primary;

  return (
    <div
      className="card shadow-sm border-0 h-100 bg-white"
      style={{
        borderRadius: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onClick={onClick}
    >
      <div className="card-body p-4 text-start">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: '48px', height: '48px', backgroundColor: style.bg, color: style.color }}
          >
            {Icon && <Icon size={22} />}
          </div>
          {trend && (
            <span
              className={`badge ${trendPositive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} border px-2 py-1`}
              style={{ fontSize: '11px', fontWeight: 600 }}
            >
              {trend}
            </span>
          )}
        </div>
        <div className="text-muted small font-weight-bold uppercase mb-1" style={{ letterSpacing: '0.04em', fontSize: '11.5px' }}>
          {title}
        </div>
        <h3 className="font-weight-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>
          {value}
        </h3>
        {subtitle && (
          <div className="text-muted xsmall mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
