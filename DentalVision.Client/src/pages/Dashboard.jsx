import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  FaUserFriends, 
  FaCalendarCheck, 
  FaDollarSign, 
  FaClipboardList, 
  FaArrowRight, 
  FaExclamationCircle,
  FaClinicMedical,
  FaCamera,
  FaFileInvoiceDollar,
  FaFileAlt
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let endpoint = '/dashboard/admin';
        if (hasRole(['Dentist'])) endpoint = '/dashboard/dentist';
        if (hasRole(['Dental Staff'])) endpoint = '/dashboard/receptionist';
        if (hasRole(['SuperAdministrator'])) endpoint = '/dashboard/superadmin';

        const response = await api.get(endpoint);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const handleToggleTenantStatus = async (tenantId) => {
    try {
      const response = await api.put(`/tenants/${tenantId}/toggle-status`);
      setData(prev => ({
        ...prev,
        tenants: prev.tenants.map(t => t.id === tenantId ? { ...t, isActive: response.data.isActive } : t)
      }));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update tenant status.");
    }
  };

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configTier, setConfigTier] = useState('Basic');
  const [configMaxUsers, setConfigMaxUsers] = useState(5);
  const [configMaxScans, setConfigMaxScans] = useState(50);
  const [configEnableBilling, setConfigEnableBilling] = useState(true);
  const [configEnableReports, setConfigEnableReports] = useState(true);
  const [configThemeColor, setConfigThemeColor] = useState('#14B8A6');

  const handleOpenConfigModal = (tenant) => {
    setSelectedTenant(tenant);
    setConfigTier(tenant.subscriptionTier || 'Basic');
    setConfigMaxUsers(tenant.maxUsers || 5);
    setConfigMaxScans(tenant.maxPlaqueAnalysesPerMonth || 50);
    setConfigEnableBilling(tenant.enableBilling !== false);
    setConfigEnableReports(tenant.enableReports !== false);
    setConfigThemeColor(tenant.themeColor || '#14B8A6');
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        subscriptionTier: configTier,
        maxUsers: parseInt(configMaxUsers),
        maxPlaqueAnalysesPerMonth: parseInt(configMaxScans),
        enableBilling: configEnableBilling,
        enableReports: configEnableReports,
        themeColor: configThemeColor
      };
      await api.put(`/tenants/${selectedTenant.id}/configuration`, payload);
      alert("Tenant configuration saved successfully!");
      setIsConfigModalOpen(false);
      
      // Reload superadmin statistics to reflect the changes in the list
      const endpoint = '/dashboard/superadmin';
      const response = await api.get(endpoint);
      setData(response.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save configuration.");
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  // --- ADMINISTRATOR DASHBOARD VIEW ---
  if (hasRole(['Administrator'])) {
    const revenueChartData = {
      labels: data?.revenueTrend?.map(d => d.label) || [],
      datasets: [
        {
          label: 'Monthly Revenue (₱)',
          data: data?.revenueTrend?.map(d => d.value) || [],
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    };

    const growthChartData = {
      labels: data?.patientGrowth?.map(d => d.label) || [],
      datasets: [
        {
          label: 'Patient Registrations',
          data: data?.patientGrowth?.map(d => d.value) || [],
          backgroundColor: '#14B8A6'
        }
      ]
    };

    return (
      <div>
        <h3 className="mb-4 font-weight-bold">Administrator Dashboard</h3>
        
        {/* Metric Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="clinic-card stat-card d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <FaUserFriends />
              </div>
              <div>
                <h6 className="text-muted small mb-1 text-start">Total Patients</h6>
                <h3 className="m-0 font-weight-bold text-start">{data?.totalPatients}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="clinic-card stat-card teal d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <FaCalendarCheck />
              </div>
              <div>
                <h6 className="text-muted small mb-1 text-start">Today's Appointments</h6>
                <h3 className="m-0 font-weight-bold text-start">{data?.todaysAppointments}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="clinic-card stat-card green d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <span className="font-weight-bold" style={{ fontSize: 18 }}>₱</span>
              </div>
              <div>
                <h6 className="text-muted small mb-1 text-start">Monthly Revenue</h6>
                <h3 className="m-0 font-weight-bold text-start">₱{data?.monthlyRevenue?.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="clinic-card stat-card red d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <FaClipboardList />
              </div>
              <div>
                <h6 className="text-muted small mb-1 text-start">Pending Validation</h6>
                <h3 className="m-0 font-weight-bold text-start">{data?.pendingReportsCount}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="row g-4">
          <div className="col-md-6">
            <div className="clinic-card">
              <h5 className="mb-3 font-weight-bold">Revenue Growth Trend</h5>
              <Line data={revenueChartData} />
            </div>
          </div>
          <div className="col-md-6">
            <div className="clinic-card">
              <h5 className="mb-3 font-weight-bold">Patient Growth Trend</h5>
              <Bar data={growthChartData} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DENTIST DASHBOARD VIEW ---
  if (hasRole(['Dentist'])) {
    return (
      <div>
        <h3 className="mb-4 font-weight-bold">Dentist Dashboard</h3>
        
        {/* Metric Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="clinic-card stat-card d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <FaUserFriends />
              </div>
              <div>
                <h6 className="text-muted small mb-1 text-start">Today's Patients</h6>
                <h3 className="m-0 font-weight-bold text-start">{data?.todaysPatientsCount}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="clinic-card stat-card red d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <FaExclamationCircle />
              </div>
              <div>
                <h6 className="text-muted small mb-1 text-start">Pending Gumline Validation</h6>
                <h3 className="m-0 font-weight-bold text-start">{data?.pendingValidations?.length || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="clinic-card stat-card green d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <FaClipboardList />
              </div>
              <div>
                <h6 className="text-muted small mb-1 text-start">Recent Clinical Reports</h6>
                <h3 className="m-0 font-weight-bold text-start">{data?.recentReports?.length || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Validation and Reports Tables */}
        <div className="row g-4">
          {/* Pending Validations */}
          {hasRole(['Dentist']) && (
            <div className="col-md-6">
              <div className="clinic-card">
                <h5 className="mb-3 font-weight-bold">Plaque Mapping Tasks</h5>
                {data?.pendingValidations?.length === 0 ? (
                  <p className="text-muted small">No pending plaque maps to validate.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover table-clinic align-middle">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Coverage</th>
                          <th>Uploaded At</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.pendingValidations?.map(v => (
                          <tr key={v.analysisId}>
                            <td className="font-weight-bold">{v.patientName}</td>
                            <td><span className="font-weight-bold text-danger">{v.coveragePercentage}%</span></td>
                            <td>{new Date(v.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td>
                              <Link to={`/plaque/validate/${v.analysisId}`} className="btn btn-sm btn-teal-clinic">
                                Map <FaArrowRight size={10} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Reports */}
          <div className={hasRole(['Dentist']) ? "col-md-6" : "col-12"}>
            <div className="clinic-card">
              <h5 className="mb-3 font-weight-bold">Recent Clinical Assessment History</h5>
              {data?.recentReports?.length === 0 ? (
                <p className="text-muted small">No recent reports found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-clinic align-middle">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Plaque %</th>
                        <th>Date</th>
                        <th>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.recentReports?.map(r => (
                        <tr key={r.reportId}>
                          <td className="font-weight-bold">{r.patientName}</td>
                          <td>{r.plaquePercentage}%</td>
                          <td>{new Date(r.reportDate).toLocaleDateString()}</td>
                          <td>
                            <Link to={`/reports/${r.reportId}`} className="btn btn-sm btn-primary-clinic">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DENTAL STAFF DASHBOARD VIEW ---
  if (hasRole(['Dental Staff'])) {
    return (
      <div>
        <h3 className="mb-4 font-weight-bold">Dental Staff Dashboard</h3>

        {/* Metric Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="clinic-card stat-card d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <FaCalendarCheck />
              </div>
              <div>
                <h6 className="text-muted small mb-1 text-start">Queue Today</h6>
                <h3 className="m-0 font-weight-bold text-start">{data?.activeQueueCount} Patients</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="clinic-card stat-card red d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <FaClipboardList />
              </div>
              <div>
                <h6 className="text-muted small mb-1 text-start">Unpaid Invoices</h6>
                <h3 className="m-0 font-weight-bold text-start">{data?.totalUnpaidInvoices} Bills</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="clinic-card stat-card green d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <span className="font-weight-bold" style={{ fontSize: 18 }}>₱</span>
              </div>
              <div>
                <h6 className="text-muted small mb-1 text-start">Total Outstanding</h6>
                <h3 className="m-0 font-weight-bold text-start">₱{data?.unpaidBalanceSum?.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Schedule List */}
        <div className="clinic-card">
          <h5 className="mb-3 font-weight-bold">Today's Appointment Schedule</h5>
          {data?.scheduledToday?.length === 0 ? (
            <p className="text-muted small">No appointments scheduled for today.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-clinic align-middle">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Dentist</th>
                    <th>Status</th>
                    <th>Billing</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.scheduledToday?.map(s => (
                    <tr key={s.appointmentId}>
                      <td className="font-weight-bold">
                        {new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>{s.patientName}</td>
                      <td>{s.dentistName}</td>
                      <td>
                        <span className="font-weight-bold" style={{ 
                          color: s.status === 'Completed' ? '#059669' :
                                 s.status === 'Scheduled' ? '#2563EB' :
                                 s.status === 'Cancelled' ? '#DC2626' :
                                 '#D97706',
                          fontSize: '13px'
                        }}>
                          ● {s.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/billing`} className="btn btn-sm btn-teal-clinic">
                          Bill
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- SUPER ADMINISTRATOR DASHBOARD VIEW ---
  if (hasRole(['SuperAdministrator'])) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: '#F8FAFC', minHeight: '85vh' }}>
        {/* Header Title Banner */}
        <div className="d-flex align-items-center justify-content-between mb-4 bg-white p-4 shadow-sm rounded-4 border-0">
          <div>
            <h3 className="font-weight-bold text-dark mb-1">Central SaaS Control Panel</h3>
            <p className="text-muted mb-0">System-wide metrics and clinic tenant account operations</p>
          </div>
          <span className="badge bg-danger px-3 py-2 fs-7 font-weight-bold shadow-sm" style={{ borderRadius: '8px' }}>
            Owner Developer Access Only
          </span>
        </div>

        {/* System Health Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm border-0 p-4 bg-white text-dark rounded-4" style={{ borderLeft: '5px solid #2563EB' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted font-weight-bold small text-uppercase">Clinics Onboarded</span>
                <span className="p-2 rounded bg-primary bg-opacity-10 text-primary">
                  <FaClinicMedical size={20} />
                </span>
              </div>
              <h2 className="font-weight-bold text-dark mb-0">{data?.totalClinics || 0}</h2>
              <span className="text-success small mt-1 d-block font-weight-bold">
                100% System Uptime
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0 p-4 bg-white text-dark rounded-4" style={{ borderLeft: '5px solid #14B8A6' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted font-weight-bold small text-uppercase">System-wide Users</span>
                <span className="p-2 rounded bg-info bg-opacity-10 text-info">
                  <FaUserFriends size={20} />
                </span>
              </div>
              <h2 className="font-weight-bold text-dark mb-0">{data?.totalUsers || 0}</h2>
              <span className="text-muted small mt-1 d-block">
                Dentists, staff, and patients
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0 p-4 bg-white text-dark rounded-4" style={{ borderLeft: '5px solid #F59E0B' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted font-weight-bold small text-uppercase">AI Plaque Analyses</span>
                <span className="p-2 rounded bg-warning bg-opacity-10 text-warning">
                  <FaCamera size={20} />
                </span>
              </div>
              <h2 className="font-weight-bold text-dark mb-0">{data?.totalPlaqueAnalyses || 0}</h2>
              <span className="text-muted small mt-1 d-block">
                Processed segments system-wide
              </span>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0 p-4 bg-white text-dark rounded-4" style={{ borderLeft: '5px solid #10B981' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted font-weight-bold small text-uppercase">Aggregate Revenue</span>
                <span className="p-2 rounded bg-success bg-opacity-10 text-success">
                  <FaFileInvoiceDollar size={20} />
                </span>
              </div>
              <h2 className="font-weight-bold text-dark mb-0">₱{(data?.totalRevenue || 0).toLocaleString()}</h2>
              <span className="text-success small mt-1 d-block font-weight-bold">
                Platform Billing Operations
              </span>
            </div>
          </div>
        </div>

        {/* Tenant Clinics Management Table */}
        <div className="card shadow-sm border-0 rounded-4 bg-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0 font-weight-bold text-dark">Tenant Accounts Management</h5>
            <span className="text-muted small">Manage clinic states and access status</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle table-clinic">
              <thead>
                <tr>
                  <th>Clinic Name</th>
                  <th>Domain / Slug</th>
                  <th>Admin Contact</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Access Controls</th>
                </tr>
              </thead>
              <tbody>
                {data?.tenants?.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="font-weight-bold text-dark">{t.name}</div>
                      {t.id === 1 && <span className="badge bg-primary bg-opacity-10 text-primary small font-weight-bold py-0.5 px-2 rounded-pill mt-1">Default Tenant</span>}
                    </td>
                    <td>
                      <code>{t.slug}</code>
                    </td>
                    <td>{t.adminEmail}</td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge px-3 py-1 font-weight-bold rounded-pill ${t.isActive ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                        {t.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>
                      {t.id === 1 ? (
                        <button className="btn btn-sm btn-outline-secondary disabled" style={{ borderRadius: '8px' }}>
                          Master Tenant Locked
                        </button>
                      ) : (
                        <div className="d-flex gap-2">
                          <button 
                            onClick={() => handleToggleTenantStatus(t.id)} 
                            className={`btn btn-sm font-weight-bold ${t.isActive ? 'btn-outline-danger' : 'btn-success text-white'}`}
                            style={{ borderRadius: '8px' }}
                          >
                            {t.isActive ? 'Suspend' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => handleOpenConfigModal(t)} 
                            className="btn btn-sm btn-teal-clinic font-weight-bold"
                            style={{ borderRadius: '8px' }}
                          >
                            Configure
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Configuration Modal */}
        {isConfigModalOpen && selectedTenant && createPortal(
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0 rounded-4" style={{ overflow: 'hidden' }}>
                <form onSubmit={handleSaveConfig}>
                  {/* Header */}
                  <div className="modal-header bg-white border-bottom border-light py-3 px-4 rounded-top-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '40px', height: '40px', backgroundColor: '#F1F5F9' }}>
                        <FaClinicMedical size={20} style={{ color: configThemeColor }} />
                      </div>
                      <div>
                        <h6 className="modal-title font-weight-bold m-0 text-dark" style={{ fontSize: '1.05rem', letterSpacing: '-0.015em' }}>Configure Clinic Settings</h6>
                        <span className="xsmall d-block text-muted" style={{ fontSize: '11px' }}>Settings for {selectedTenant.name}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn-close shadow-none border-0 bg-transparent text-muted fs-4" 
                      onClick={() => setIsConfigModalOpen(false)}
                      style={{ outline: 'none' }}
                    >×</button>
                  </div>

                  {/* Body */}
                  <div className="modal-body p-4" style={{ backgroundColor: '#F8FAFC' }}>
                    {/* Card 1: Plan Details & Quotas */}
                    <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
                      <div className="font-weight-bold text-dark small mb-3">Plan Details & Quotas</div>
                      
                      <div className="mb-3">
                        <label className="form-label font-weight-bold xsmall text-uppercase text-muted" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Subscription Tier</label>
                        <select 
                          className="form-select border shadow-none bg-white" 
                          value={configTier} 
                          onChange={(e) => setConfigTier(e.target.value)}
                          style={{ borderRadius: '8px', border: '1px solid #E2E8F0', padding: '8px 12px', fontSize: '13.5px', fontWeight: '500' }}
                        >
                          <option value="Basic">Basic Plan</option>
                          <option value="Professional">Professional Plan</option>
                          <option value="Enterprise">Enterprise Plan</option>
                        </select>
                      </div>

                      <div className="row g-2">
                        <div className="col">
                          <label className="form-label font-weight-bold xsmall text-uppercase text-muted" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Max Staff Accounts</label>
                          <input 
                            type="number" 
                            className="form-control border shadow-none bg-white" 
                            value={configMaxUsers} 
                            onChange={(e) => setConfigMaxUsers(e.target.value)}
                            min="1"
                            required
                            style={{ borderRadius: '8px', border: '1px solid #E2E8F0', padding: '8px 12px', fontSize: '13.5px' }}
                          />
                        </div>
                        <div className="col">
                          <label className="form-label font-weight-bold xsmall text-uppercase text-muted" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Max Monthly Scans</label>
                          <input 
                            type="number" 
                            className="form-control border shadow-none bg-white" 
                            value={configMaxScans} 
                            onChange={(e) => setConfigMaxScans(e.target.value)}
                            min="1"
                            required
                            style={{ borderRadius: '8px', border: '1px solid #E2E8F0', padding: '8px 12px', fontSize: '13.5px' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Feature Access Control */}
                    <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
                      <div className="font-weight-bold text-dark small mb-3">Feature Modules Access</div>
                      
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light bg-opacity-40" style={{ border: '1px solid #F1F5F9' }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center justify-content-center rounded-2 text-teal" style={{ width: '32px', height: '32px', color: '#14B8A6', backgroundColor: 'rgba(20, 184, 166, 0.08)' }}>
                              <FaFileInvoiceDollar size={15} />
                            </div>
                            <div>
                              <div className="font-weight-bold text-dark xsmall" style={{ fontSize: '12px' }}>Billing & Payments</div>
                              <div className="text-muted xsmall" style={{ fontSize: '10px' }}>Clinic invoices & transactions</div>
                            </div>
                          </div>
                          <div className="form-check form-switch m-0">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={configEnableBilling} 
                              onChange={(e) => setConfigEnableBilling(e.target.checked)} 
                            />
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light bg-opacity-40" style={{ border: '1px solid #F1F5F9' }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '32px', height: '32px', color: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.08)' }}>
                              <FaFileAlt size={15} />
                            </div>
                            <div>
                              <div className="font-weight-bold text-dark xsmall" style={{ fontSize: '12px' }}>Clinical Reports</div>
                              <div className="text-muted xsmall" style={{ fontSize: '10px' }}>Advanced patient metrics & downloads</div>
                            </div>
                          </div>
                          <div className="form-check form-switch m-0">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={configEnableReports} 
                              onChange={(e) => setConfigEnableReports(e.target.checked)} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Theme Branding */}
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                      <div className="font-weight-bold text-dark small mb-3">Theme Customization (Clinic Brand Color)</div>
                      
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        {[
                          { name: 'Teal Clinic', hex: '#14B8A6' },
                          { name: 'Royal Indigo', hex: '#6366F1' },
                          { name: 'Sunset Amber', hex: '#F59E0B' },
                          { name: 'Rose Medical', hex: '#EF4444' },
                          { name: 'Royal Purple', hex: '#8B5CF6' }
                        ].map(preset => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => setConfigThemeColor(preset.hex)}
                            className="rounded-circle border-0 p-0 position-relative d-flex align-items-center justify-content-center"
                            style={{
                              width: '28px',
                              height: '28px',
                              backgroundColor: preset.hex,
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                              transition: 'all 0.2s',
                              transform: configThemeColor.toLowerCase() === preset.hex.toLowerCase() ? 'scale(1.1)' : 'scale(1)'
                            }}
                            title={preset.name}
                          >
                            {configThemeColor.toLowerCase() === preset.hex.toLowerCase() && (
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }}></div>
                            )}
                          </button>
                        ))}
                        
                        {/* Custom Color Input */}
                        <div className="ms-auto d-flex align-items-center gap-2 bg-light p-1 px-2 rounded-pill" style={{ border: '1px solid #E2E8F0' }}>
                          <input 
                            type="color" 
                            className="form-control form-control-color border-0 p-0 bg-transparent" 
                            value={configThemeColor} 
                            onChange={(e) => setConfigThemeColor(e.target.value)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', borderRadius: '50%' }}
                          />
                          <span className="font-monospace text-muted xsmall" style={{ fontSize: '10px' }}>{configThemeColor.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="modal-footer border-top border-light py-3 px-4 bg-white rounded-bottom-4 justify-content-between">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary font-weight-bold px-3 py-1.5" 
                      onClick={() => setIsConfigModalOpen(false)}
                      style={{ borderRadius: '8px', fontSize: '13px', border: '1px solid #E2E8F0', backgroundColor: '#ffffff', color: '#64748B' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn font-weight-bold px-4 py-1.5 text-white" 
                      style={{ 
                        borderRadius: '8px', 
                        backgroundColor: configThemeColor,
                        border: 'none',
                        fontSize: '13px',
                        boxShadow: `0 4px 6px rgba(0, 0, 0, 0.05)`,
                        transition: 'background-color 0.2s'
                      }}
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return null;
};

export default Dashboard;
