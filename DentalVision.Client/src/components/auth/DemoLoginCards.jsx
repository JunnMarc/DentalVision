import React from 'react';
import { FaUserShield, FaUserMd, FaConciergeBell, FaUser, FaCrown } from 'react-icons/fa';

export const DemoLoginCards = ({ onSelectCredentials }) => {
  const demoAccounts = [
    {
      role: 'Super Administrator',
      subtitle: 'Multi-Tenant Platform Owner',
      email: 'superadmin@dentalvision.com',
      password: 'SuperAdmin123!',
      icon: FaCrown,
      color: '#7C3AED',
      bg: '#F5F3FF'
    },
    {
      role: 'Clinic Administrator',
      subtitle: 'Arthur Pendragon',
      email: 'admin@dentalvision.com',
      password: 'Admin123!',
      icon: FaUserShield,
      color: '#2563EB',
      bg: '#EFF6FF'
    },
    {
      role: 'Licensed Clinician',
      subtitle: 'Dr. John Smith (Orthodontics)',
      email: 'dentist1@dentalvision.com',
      password: 'Dentist123!',
      icon: FaUserMd,
      color: '#0891B2',
      bg: '#ECFEFF'
    },
    {
      role: 'Clinic Receptionist',
      subtitle: 'Alice Margatroid',
      email: 'receptionist1@dentalvision.com',
      password: 'Recept123!',
      icon: FaConciergeBell,
      color: '#059669',
      bg: '#ECFDF5'
    },
    {
      role: 'Registered Patient',
      subtitle: 'James Smith',
      email: 'james.smith@gmail.com',
      password: 'Patient123!',
      icon: FaUser,
      color: '#D97706',
      bg: '#FFFBEB'
    }
  ];

  return (
    <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: '16px' }}>
      <h6 className="font-weight-bold text-dark mb-2 text-start">One-Click Demonstration Logins</h6>
      <p className="text-muted xsmall mb-3 text-start">
        Click any role profile below to auto-fill verified test credentials for defense testing:
      </p>
      <div className="d-flex flex-column gap-2">
        {demoAccounts.map((account, idx) => {
          const Icon = account.icon;
          return (
            <button
              key={idx}
              type="button"
              className="btn btn-light border text-start d-flex align-items-center justify-content-between p-2.5 hover-scale"
              style={{ borderRadius: '12px', transition: 'all 0.15s ease' }}
              onClick={() => onSelectCredentials(account.email, account.password)}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center shadow-xs"
                  style={{ width: '32px', height: '32px', backgroundColor: account.bg, color: account.color }}
                >
                  <Icon size={14} />
                </div>
                <div>
                  <div className="font-weight-bold text-dark" style={{ fontSize: '12.5px' }}>
                    {account.role}
                  </div>
                  <div className="xsmall text-muted">{account.subtitle}</div>
                </div>
              </div>
              <span className="badge bg-light text-muted border px-2 py-1" style={{ fontSize: '10px' }}>
                Auto-fill
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DemoLoginCards;
