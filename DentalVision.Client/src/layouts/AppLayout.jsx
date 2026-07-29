import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaClinicMedical, 
  FaThLarge, 
  FaUserFriends, 
  FaCalendarAlt, 
  FaFileInvoiceDollar, 
  FaCamera, 
  FaFileAlt, 
  FaHistory, 
  FaCog, 
  FaSignOutAlt,
  FaUser
} from 'react-icons/fa';

const AppLayout = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const getRoleName = () => {
    if (!user) return '';
    const roleMap = { 1: "Administrator", 2: "Dentist", 3: "Dental Staff", 4: "Patient" };
    return typeof user.role === 'number' ? roleMap[user.role] : user.role;
  };

  const menuItems = [
    { path: '/my-profile', label: 'My Profile', icon: <FaUser />, roles: ['Patient'] },
    { path: '/dashboard', label: 'Dashboard', icon: <FaThLarge />, roles: ['Administrator', 'Dentist', 'Dental Staff'] },
    { path: '/patients', label: 'Patients', icon: <FaUserFriends />, roles: ['Administrator', 'Dentist', 'Dental Staff'] },
    { path: '/appointments', label: 'Appointments', icon: <FaCalendarAlt />, roles: ['Administrator', 'Dentist', 'Dental Staff'] },
    { path: '/billing', label: 'Billing & Payments', icon: <FaFileInvoiceDollar />, roles: ['Administrator', 'Dental Staff'] },
    { path: '/plaque/upload', label: 'Dental Upload', icon: <FaCamera />, roles: ['Dentist'] },
    { path: '/reports', label: 'Clinical Reports', icon: <FaFileAlt />, roles: ['Administrator', 'Dentist'] },
    { path: '/users', label: 'Staff Accounts', icon: <FaUserFriends />, roles: ['Administrator'] },
    { path: '/logs', label: 'Audit Logs', icon: <FaHistory />, roles: ['Administrator'] },
    { path: '/settings', label: 'Clinic Settings', icon: <FaCog />, roles: ['Administrator'] }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <Link to={user?.role === 4 || user?.role === 'Patient' ? "/my-profile" : "/dashboard"} className="sidebar-header d-flex align-items-center gap-2 text-decoration-none" style={{ cursor: 'pointer' }}>
          <FaClinicMedical size={24} className="text-teal" style={{ color: '#14B8A6' }} />
          <h5 className="m-0 font-weight-bold tracking-tight text-white">DentalVision</h5>
        </Link>

        <nav className="sidebar-nav">
          {menuItems
            .filter(item => hasRole(item.roles))
            .map(item => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`nav-item-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
        </nav>

        <div className="sidebar-footer">
          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="avatar bg-teal text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, backgroundColor: '#14B8A6', fontSize: 14 }}>
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="user-info text-truncate">
              <div className="small font-weight-bold text-dark">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="xsmall text-muted" style={{ fontSize: 11 }}>
                {getRoleName()}
              </div>
            </div>
          </div>
          <button onClick={handleLogoutClick} className="btn btn-link nav-item-link text-start w-100 p-0 m-0 border-0 text-danger" style={{ fontSize: 13 }}>
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="app-header">
          <h5 className="m-0 font-weight-bold" style={{ color: '#1E293B' }}>
            Dental Clinic Management Portal
          </h5>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>
        
        <div className="page-container">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-body p-4 text-center">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: '60px', height: '60px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                  <FaSignOutAlt size={24} />
                </div>
                <h5 className="font-weight-bold text-dark mb-2">Confirm Sign Out</h5>
                <p className="text-muted small mb-0">Are you sure you want to log out of your account?</p>
              </div>
              <div className="modal-footer bg-light border-0 justify-content-center py-3">
                <button type="button" className="btn btn-sm btn-outline-secondary px-4 me-2" onClick={() => setShowLogoutConfirm(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-sm btn-danger px-4 text-white" onClick={handleConfirmLogout}>
                  Yes, Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
