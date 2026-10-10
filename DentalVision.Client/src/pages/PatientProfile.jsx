import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  FaUser,
  FaFolderOpen,
  FaFileInvoiceDollar,
  FaCamera,
  FaFilePdf,
  FaEdit,
  FaTooth,
  FaCheckCircle
} from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/common/PageHeader';
import ProfileSummaryCard from '../components/profile/ProfileSummaryCard';
import AllergiesMedicalPanel from '../components/profile/AllergiesMedicalPanel';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import OdontogramChart from '../components/OdontogramChart';

export const PatientProfile = () => {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [patient, setPatient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [reports, setReports] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records');
  const [exportingId, setExportingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { register, handleSubmit, reset, setValue } = useForm();

  const handleExportPDF = async (reportId) => {
    try {
      setExportingId(reportId);
      const response = await api.get(`/reports/${reportId}/export`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error("Failed to export clinical report PDF:", err);
      alert("Failed to export PDF clinical report. Please verify permissions.");
    } finally {
      setExportingId(null);
    }
  };

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const patientRes = await api.get(`/patients/${id}`);
      const p = patientRes.data;
      setPatient(p);

      setValue("firstName", p.firstName);
      setValue("lastName", p.lastName);
      setValue("dateOfBirth", p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '');
      setValue("gender", p.gender || 'Male');
      setValue("phone", p.phone || '');
      setValue("email", p.email || '');
      setValue("address", p.address || '');
      setValue("medicalHistory", p.medicalHistory || '');
      setValue("allergies", p.allergies || '');
      setValue("emergencyContactName", p.emergencyContactName || '');
      setValue("emergencyContactPhone", p.emergencyContactPhone || '');

      // Reports
      try {
        const reportsRes = await api.get(`/reports/patient/${id}`);
        setReports(reportsRes.data);
      } catch (e) {}

      // Invoices
      try {
        const invoicesRes = await api.get(`/billing/invoices/patient/${id}`);
        setInvoices(invoicesRes.data);
      } catch (e) {}

    } catch (error) {
      console.error("Error loading patient profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const onEditSubmit = async (data) => {
    try {
      await api.put(`/patients/${id}`, data);
      setShowEditModal(false);
      fetchPatientData();
    } catch (error) {
      console.error("Failed to update patient profile:", error);
      alert("Failed to update patient profile details.");
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-5 text-center">
        <div className="spinner-border text-primary mx-auto mb-2" role="status" />
        <div className="small text-muted">Loading patient chart...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container-fluid p-5 text-center">
        <h5 className="text-danger font-weight-bold">Patient Record Not Found</h5>
        <Link to="/patients" className="btn btn-sm btn-primary mt-3">← Return to Patient List</Link>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1440px' }}>
      {/* Page Header */}
      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle={`Patient ID: ${patient.patientCode || `PAT-00${patient.id}`} • Registered Chart Record`}
        icon={FaUser}
        actions={
          <div className="d-flex align-items-center gap-2">
            <StatusBadge type="profile" isProfileCompleted={patient.isProfileCompleted} />
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5 px-3 py-1.5 font-weight-bold"
              onClick={() => setShowEditModal(true)}
            >
              <FaEdit size={12} /> Edit Profile
            </button>
            {hasRole(['Dentist', 'Administrator']) && (
              <Link
                to={`/consultation?patientId=${patient.id}`}
                state={{ patientId: patient.id, patientName: `${patient.firstName} ${patient.lastName}` }}
                className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 px-3 py-1.5 font-weight-bold shadow-sm"
              >
                <FaTooth size={12} /> Clinical Workspace
              </Link>
            )}
            {hasRole(['Dentist', 'Dental Staff']) && (
              <Link
                to="/plaque/upload"
                state={{ patientId: patient.id }}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 px-3 py-1.5 font-weight-bold"
              >
                <FaCamera size={12} /> Plaque Scan
              </Link>
            )}
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="card shadow-sm border-0 mb-4 bg-white" style={{ borderRadius: '16px' }}>
        <div className="card-body p-2">
          <div className="nav nav-pills nav-fill gap-2" role="tablist">
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`nav-link py-2 font-weight-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'records' ? 'active bg-primary text-white shadow-sm' : 'text-muted'}`}
              style={{ borderRadius: '12px' }}
            >
              <FaFolderOpen /> Clinical Chart & Records
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('odontogram')}
              className={`nav-link py-2 font-weight-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'odontogram' ? 'active bg-primary text-white shadow-sm' : 'text-muted'}`}
              style={{ borderRadius: '12px' }}
            >
              <FaTooth /> Interactive Odontogram (FDI)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`nav-link py-2 font-weight-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'billing' ? 'active bg-primary text-white shadow-sm' : 'text-muted'}`}
              style={{ borderRadius: '12px' }}
            >
              <FaFileInvoiceDollar /> Billing Statements ({invoices.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: Clinical Records */}
      {activeTab === 'records' && (
        <div className="row g-4">
          <div className="col-lg-5">
            <ProfileSummaryCard profile={patient} />
            <AllergiesMedicalPanel
              allergies={patient.allergies}
              medicalHistory={patient.medicalHistory}
              isEditable={true}
              onEditClick={() => setShowEditModal(true)}
            />
          </div>

          <div className="col-lg-7">
            {/* Clinical Reports */}
            <div className="card shadow-sm border-0 p-4 bg-white text-start" style={{ borderRadius: '16px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="font-weight-bold text-dark mb-0">Clinical Assessment Reports</h5>
                <span className="badge bg-light text-muted border">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-4 bg-light rounded text-muted small">
                  No clinical assessment reports on file for this patient.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Report ID</th>
                        <th>Attending Clinician</th>
                        <th>Date</th>
                        <th>Plaque %</th>
                        <th>Status</th>
                        <th className="text-end">Export</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r.id}>
                          <td className="font-weight-bold text-primary">#REP-00{r.id}</td>
                          <td>{r.dentistName}</td>
                          <td className="text-muted">{new Date(r.reportDate).toLocaleDateString()}</td>
                          <td className="font-weight-bold text-danger">{r.coveragePercentage?.toFixed(1) || 0}%</td>
                          <td>
                            <span className={`badge ${r.approvalStatus === 'Approved' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} px-2 py-1`}>
                              ● {r.approvalStatus}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              onClick={() => handleExportPDF(r.id)}
                              disabled={exportingId === r.id}
                              className="btn btn-sm btn-outline-danger px-2.5 py-1 d-inline-flex align-items-center gap-1"
                              style={{ fontSize: '11.5px' }}
                            >
                              <FaFilePdf /> {exportingId === r.id ? 'Exporting...' : 'PDF'}
                            </button>
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
      )}

      {/* TAB CONTENT 2: Odontogram FDI Chart */}
      {activeTab === 'odontogram' && (
        <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: '16px' }}>
          <OdontogramChart patientId={id} />
        </div>
      )}

      {/* TAB CONTENT 3: Billing Statements */}
      {activeTab === 'billing' && (
        <div className="card shadow-sm border-0 p-4 bg-white text-start" style={{ borderRadius: '16px' }}>
          <h5 className="font-weight-bold text-dark mb-3">Patient Invoices & Payment Receipts</h5>

          {invoices.length === 0 ? (
            <div className="text-center py-4 bg-light rounded text-muted small">
              No invoices generated for this patient yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date</th>
                    <th>Total Billed</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-weight-bold text-primary">INV-00{inv.id}</td>
                      <td className="text-muted">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                      <td className="font-weight-bold">₱{inv.grandTotal?.toFixed(2)}</td>
                      <td className={`font-weight-bold ${inv.balanceDue > 0 ? 'text-danger' : 'text-success'}`}>
                        ₱{inv.balanceDue?.toFixed(2)}
                      </td>
                      <td>
                        <StatusBadge type="payment" status={inv.paymentStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Patient Chart Record"
        subtitle={`Updating info for ${patient.firstName} ${patient.lastName}`}
        icon={FaEdit}
        size="lg"
      >
        <form onSubmit={handleSubmit(onEditSubmit)}>
          <div className="row g-3 text-start">
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">First Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control" {...register("firstName", { required: true })} />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Last Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control" {...register("lastName", { required: true })} />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Date of Birth</label>
              <input type="date" className="form-control" {...register("dateOfBirth")} />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Gender</label>
              <select className="form-select" {...register("gender")}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Phone Number</label>
              <input type="tel" className="form-control" {...register("phone")} />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Email Address</label>
              <input type="email" className="form-control" {...register("email")} />
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">Address</label>
              <input type="text" className="form-control" {...register("address")} />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold text-danger">Known Allergies</label>
              <input type="text" className="form-control border-danger-subtle" {...register("allergies")} placeholder="e.g. Penicillin, Latex" />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Medical History</label>
              <input type="text" className="form-control" {...register("medicalHistory")} placeholder="e.g. Hypertension" />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Emergency Contact Name</label>
              <input type="text" className="form-control" {...register("emergencyContactName")} />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Emergency Contact Phone</label>
              <input type="tel" className="form-control" {...register("emergencyContactPhone")} />
            </div>
            <div className="col-12 text-end mt-4">
              <button type="button" className="btn btn-outline-secondary me-2 px-3" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4 font-weight-bold">
                Save Changes ✓
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientProfile;
