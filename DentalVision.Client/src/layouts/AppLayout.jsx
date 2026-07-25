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
  FaSignOutAlt 
} from 'react-icons/fa';

const AppLayout = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleName = () => {
    if (!user) return '';
    const roleMap = { 1: "Administrator", 2: "Dentist", 3: "Dental Staff" };
    return typeof user.role === 'number' ? roleMap[user.role] : user.role;
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaThLarge />, roles: ['Administrator', 'Dentist', 'Dental Staff'] },
    { path: '/patients', label: 'Patients', icon: <FaUserFriends />, roles: ['Administrator', 'Dentist', 'Dental Staff'] },
    { path: '/appointments', label: 'Appointments', icon: <FaCalendarAlt />, roles: ['Administrator', 'Dentist', 'Dental Staff'] },
    { path: '/billing', label: 'Billing & Payments', icon: <FaFileInvoiceDollar />, roles: ['Administrator', 'Dental Staff'] },
    { path: '/plaque/upload', label: 'Dental Upload', icon: <FaCamera />, roles: ['Dentist', 'Dental Staff'] },
    { path: '/reports', label: 'Clinical Reports', icon: <FaFileAlt />, roles: ['Administrator', 'Dentist'] },
    { path: '/users', label: 'Staff Accounts', icon: <FaUserFriends />, roles: ['Administrator'] },
    { path: '/logs', label: 'Audit Logs', icon: <FaHistory />, roles: ['Administrator'] },
    { path: '/settings', label: 'Clinic Settings', icon: <FaCog />, roles: ['Administrator'] }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <Link to="/dashboard" className="sidebar-header d-flex align-items-center gap-2 text-decoration-none" style={{ cursor: 'pointer' }}>
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
          <button onClick={handleLogout} className="btn btn-link nav-item-link text-start w-100 p-0 m-0 border-0 text-danger" style={{ fontSize: 13 }}>
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
    </div>
  );
};

export default AppLayout;
