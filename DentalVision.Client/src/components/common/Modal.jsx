import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * Reusable Modal Component
 * Handles backdrop clicks, ESC key to dismiss, responsive widths, and smooth transitions.
 * Renders via React Portal directly into document.body to ensure full viewport overlay.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  headerVariant = 'primary', // 'primary' | 'dark' | 'success' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  children,
  footer
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl'
  };

  const headerColors = {
    primary: 'bg-primary text-white',
    dark: 'bg-dark text-white',
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
    light: 'bg-light text-dark border-bottom'
  };

  const modalContent = (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1060,
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className={`modal-dialog modal-dialog-centered ${sizeClasses[size] || ''}`}>
        <div
          className="modal-content border-0 shadow-lg overflow-hidden animate-fade-in"
          style={{ borderRadius: '16px' }}
        >
          {/* Header */}
          <div className={`modal-header py-3 px-4 ${headerColors[headerVariant] || headerColors.primary}`}>
            <div className="d-flex align-items-center gap-2">
              {Icon && <Icon size={20} className="me-1" />}
              <div>
                <h5 className="modal-title font-weight-bold mb-0" style={{ fontSize: '1.1rem' }}>
                  {title}
                </h5>
                {subtitle && (
                  <p className="mb-0 xsmall opacity-75">{subtitle}</p>
                )}
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                className={`btn-close ${headerVariant !== 'light' ? 'btn-close-white' : ''}`}
                onClick={onClose}
                aria-label="Close"
              />
            )}
          </div>

          {/* Body */}
          <div className="modal-body p-4 text-start">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="modal-footer bg-light border-top py-3 px-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
