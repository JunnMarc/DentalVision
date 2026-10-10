import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  FaUserFriends,
  FaCalendarCheck,
  FaDollarSign,
  FaMicroscope,
  FaBuilding,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaCog,
  FaChartLine
} from 'react-icons/fa';
import MetricCard from '../components/common/MetricCard';
import PageHeader from '../components/common/PageHeader';
import QuickActionToolbar from '../components/dashboard/QuickActionToolbar';
import RecentAppointmentsList from '../components/dashboard/RecentAppointmentsList';
import PlaqueActivityFeed from '../components/dashboard/PlaqueActivityFeed';
import Modal from '../components/common/Modal';

export const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // SuperAdmin Tenant Config Modal
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configFormData, setConfigFormData] = useState({
    tier: 'Basic',
    maxUsers: 5,
    maxScans: 50,
    enableBilling: true,
    enableReports: true,
    themeColor: '#14B8A6'
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
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

  const handleOpenConfigModal = (tenant) => {
    setSelectedTenant(tenant);
    setConfigFormData({
      tier: tenant.subscriptionTier || 'Basic',
      maxUsers: tenant.maxUsers || 5,
      maxScans: tenant.maxPlaqueAnalysesPerMonth || 50,
      enableBilling: tenant.enableBilling !== false,
      enableReports: tenant.enableReports !== false,
      themeColor: tenant.themeColor || '#14B8A6'
    });
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    try {
      await api.put(`/tenants/${selectedTenant.id}/limits`, {
        subscriptionTier: configFormData.tier,
        maxUsers: parseInt(configFormData.maxUsers),
        maxPlaqueAnalysesPerMonth: parseInt(configFormData.maxScans),
        enableBilling: configFormData.enableBilling,
        enableReports: configFormData.enableReports,
        themeColor: configFormData.themeColor
      });
      setIsConfigModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      alert("Failed to save tenant configuration.");
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-4 text-center">
        <div className="spinner-border text-primary my-5" role="status" />
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1440px' }}>
      {/* Page Header */}
      <PageHeader
        title={
          hasRole(['SuperAdministrator']) ? "Platform Super-Admin Console" :
          hasRole(['Dentist']) ? `Welcome, Dr. ${user?.firstName} ${user?.lastName}` :
          hasRole(['Dental Staff']) ? "Front Desk & Reception Dashboard" :
          "Clinic Overview & Performance"
        }
        subtitle={
          hasRole(['SuperAdministrator']) ? "Multi-tenant dental SaaS subscriptions and global system telemetry." :
          hasRole(['Dentist']) ? "Real-time AI plaque detection queues, patient records, and consultation schedules." :
          "Comprehensive overview of appointments, patients, and clinical revenue."
        }
        icon={hasRole(['SuperAdministrator']) ? FaBuilding : FaChartLine}
      />

      {/* SUPERADMINISTRATOR VIEW */}
      {hasRole(['SuperAdministrator']) && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <MetricCard
                title="Total Dental Clinics"
                value={data?.totalTenants || 0}
                subtitle="Registered clinic tenants"
                icon={FaBuilding}
                variant="primary"
              />
            </div>
            <div className="col-md-3">
              <MetricCard
                title="Active SaaS Tenants"
                value={data?.activeTenants || 0}
                subtitle="Operational clinics"
                icon={FaCheckCircle}
                variant="success"
              />
            </div>
            <div className="col-md-3">
              <MetricCard
                title="Global Users"
                value={data?.totalUsers || 0}
                subtitle="Clinicians & staff members"
                icon={FaUserFriends}
                variant="info"
              />
            </div>
            <div className="col-md-3">
              <MetricCard
                title="AI Plaque Scans"
                value={data?.totalScans || 0}
                subtitle="Processed platform-wide"
                icon={FaMicroscope}
                variant="purple"
              />
            </div>
          </div>

          {/* Tenants Management Table */}
          <div className="card shadow-sm border-0 bg-white" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white border-0 p-4 pb-2">
              <h5 className="font-weight-bold text-dark mb-0">Registered Clinic Tenants</h5>
            </div>
            <div className="card-body p-4 pt-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13.5px' }}>
                  <thead className="table-light">
                    <tr>
                      <th className="py-3 px-4">Clinic Name</th>
                      <th className="py-3">Subdomain Slug</th>
                      <th className="py-3">Tier</th>
                      <th className="py-3">User Limit</th>
                      <th className="py-3">Monthly Scan Limit</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 text-end px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.tenants || []).map(t => (
                      <tr key={t.id}>
                        <td className="py-3 px-4 font-weight-bold">{t.name}</td>
                        <td className="py-3 text-muted">{t.slug}.dentalvision.io</td>
                        <td className="py-3"><span className="badge bg-primary-subtle text-primary px-2">{t.subscriptionTier || 'Basic'}</span></td>
                        <td className="py-3">{t.maxUsers} seats</td>
                        <td className="py-3">{t.maxPlaqueAnalysesPerMonth} scans/mo</td>
                        <td className="py-3">
                          <span className={`badge ${t.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            {t.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-3 text-end px-4">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary me-2"
                            onClick={() => handleOpenConfigModal(t)}
                          >
                            <FaCog /> Configure
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${t.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={() => handleToggleTenantStatus(t.id)}
                          >
                            {t.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DENTIST & CLINICAL DASHBOARD */}
      {hasRole(['Dentist']) && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <MetricCard
                title="Pending AI Verifications"
                value={Array.isArray(data?.pendingValidations) ? data.pendingValidations.length : (data?.pendingValidations || 0)}
                subtitle="Awaiting clinician sign-off"
                icon={FaExclamationTriangle}
                variant="warning"
              />
            </div>
            <div className="col-md-3">
              <MetricCard
                title="Today's Consultations"
                value={data?.todaysPatientsCount ?? data?.todayAppointmentsCount ?? 0}
                subtitle="Scheduled for you today"
                icon={FaCalendarCheck}
                variant="primary"
              />
            </div>
            <div className="col-md-3">
              <MetricCard
                title="Completed Exams"
                value={Array.isArray(data?.recentReports) ? data.recentReports.length : (data?.completedExamsCount || 0)}
                subtitle="This month"
                icon={FaCheckCircle}
                variant="success"
              />
            </div>
            <div className="col-md-3">
              <MetricCard
                title="Active Patients"
                value={data?.totalPatients ?? (Array.isArray(data?.recentReports) ? data.recentReports.length : 0)}
                subtitle="Under clinic care"
                icon={FaUserFriends}
                variant="info"
              />
            </div>
          </div>

          <QuickActionToolbar hasRole={hasRole} />

          <div className="row g-4">
            <div className="col-lg-6">
              <RecentAppointmentsList appointments={data?.todayAppointments || []} />
            </div>
            <div className="col-lg-6">
              <PlaqueActivityFeed analyses={data?.pendingValidations || data?.recentAnalyses || []} />
            </div>
          </div>
        </>
      )}

      {/* ADMIN & RECEPTIONIST DASHBOARD */}
      {!hasRole(['SuperAdministrator', 'Dentist']) && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <MetricCard
                title="Total Registered Patients"
                value={data?.totalPatients || 0}
                subtitle="Digital patient charts"
                icon={FaUserFriends}
                variant="primary"
              />
            </div>
            <div className="col-md-3">
              <MetricCard
                title="Today's Appointments"
                value={data?.todayAppointmentsCount || 0}
                subtitle="Confirmed consultations"
                icon={FaCalendarCheck}
                variant="success"
              />
            </div>
            <div className="col-md-3">
              <MetricCard
                title="Monthly Billed Revenue"
                value={`₱${(data?.monthlyRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                subtitle="Current billing cycle"
                icon={FaDollarSign}
                variant="info"
              />
            </div>
            <div className="col-md-3">
              <MetricCard
                title="Pending Booking Requests"
                value={data?.pendingRequestsCount || 0}
                subtitle="Awaiting desk confirmation"
                icon={FaClock}
                variant="warning"
              />
            </div>
          </div>

          <QuickActionToolbar hasRole={hasRole} />

          <div className="row g-4">
            <div className="col-lg-6">
              <RecentAppointmentsList appointments={data?.todayAppointments || []} />
            </div>
            <div className="col-lg-6">
              <PlaqueActivityFeed analyses={data?.recentAnalyses || []} />
            </div>
          </div>
        </>
      )}

      {/* SuperAdmin Tenant Configuration Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={`Configure Limits: ${selectedTenant?.name}`}
        subtitle="Manage SaaS subscription limits and feature access"
        icon={FaCog}
        size="md"
      >
        <form onSubmit={handleSaveConfig}>
          <div className="row g-3 text-start">
            <div className="col-12">
              <label className="form-label small font-weight-bold">Subscription Plan</label>
              <select
                className="form-select"
                value={configFormData.tier}
                onChange={(e) => setConfigFormData({ ...configFormData, tier: e.target.value })}
              >
                <option value="Basic">Basic (Solo Practice)</option>
                <option value="Professional">Professional (Group Clinic)</option>
                <option value="Enterprise">Enterprise (Hospital Network)</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small font-weight-bold">Max Clinicians / Staff</label>
              <input
                type="number"
                className="form-control"
                value={configFormData.maxUsers}
                onChange={(e) => setConfigFormData({ ...configFormData, maxUsers: e.target.value })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small font-weight-bold">Monthly AI Scans Limit</label>
              <input
                type="number"
                className="form-control"
                value={configFormData.maxScans}
                onChange={(e) => setConfigFormData({ ...configFormData, maxScans: e.target.value })}
              />
            </div>
            <div className="col-12 text-end mt-4">
              <button type="button" className="btn btn-outline-secondary me-2 px-3" onClick={() => setIsConfigModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4 font-weight-bold">
                Save Limits ✓
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
