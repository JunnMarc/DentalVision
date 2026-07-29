import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  FaUserFriends, 
  FaCalendarCheck, 
  FaDollarSign, 
  FaClipboardList, 
  FaArrowRight, 
  FaExclamationCircle 
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

  return null;
};

export default Dashboard;
