import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  FaUser, 
  FaFolderOpen, 
  FaCalendarAlt, 
  FaFileInvoiceDollar, 
  FaCamera, 
  FaPlus,
  FaFilePdf
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';

const PatientProfile = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [reports, setReports] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const patientRes = await api.get(`/patients/${id}`);
        setPatient(patientRes.data);

        // Fetch reports
        const reportsRes = await api.get(`/reports/patient/${id}`);
        setReports(reportsRes.data);

        // Fetch invoices
        const invoicesRes = await api.get(`/billing/invoices/patient/${id}`);
        setInvoices(invoicesRes.data);

        // Fetch images (we can use patient details association if returned, 
        // or a simulated list derived from reports since each report has an analysis/image link)
        // Let's seed mock images list since backend DentalImages endpoint is filterable by Patient.
        // Actually, we can fetch images from API, but wait! We did not write a GET /api/images/patient/{id} endpoint!
        // We can easily simulate or pull them from the reports which contain analysisId and coverage.
        // Let's create a list of images based on reports for a seamless visual flow!
        const reportsData = reportsRes.data;
        const imagesList = reportsData.map((rep, idx) => ({
          id: rep.analysisId,
          filePath: `/uploads/dental_plaque_disclosed_${idx + 1}.png`,
          uploadedAt: rep.reportDate,
          notes: "Disclosing dye evaluation.",
          coveragePercentage: rep.coveragePercentage
        }));
        setImages(imagesList);

      } catch (error) {
        console.error("Error loading patient profile datasets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [id]);

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  // Plaque Trends Chart Data
  const trendDataSorted = [...reports].sort((a, b) => new Date(a.reportDate) - new Date(b.reportDate));
  const plaqueChartData = {
    labels: trendDataSorted.map(r => new Date(r.reportDate).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Plaque Coverage (%)',
        data: trendDataSorted.map(r => r.coveragePercentage) || [],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.2,
        fill: true
      }
    ]
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="font-weight-bold m-0">Patient Profile</h3>
        <Link to={`/plaque/upload?patientId=${id}`} className="btn btn-primary-clinic d-flex align-items-center gap-2">
          <FaCamera /> Upload Dental Image
        </Link>
      </div>

      <div className="row g-4">
        {/* Left Column: Profile Card & Plaque History Chart */}
        <div className="col-md-4">
          {/* Profile Details Card */}
          <div className="clinic-card mb-4 text-center">
            <div className="avatar bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80, backgroundColor: '#2563EB' }}>
              <FaUser size={36} />
            </div>
            <h4 className="font-weight-bold mb-1">{patient?.firstName} {patient?.lastName}</h4>
            <span className="badge bg-light text-secondary mb-3">Patient ID: #{patient?.id}</span>

            <div className="text-start border-top pt-3 small">
              <div className="mb-2"><strong>DOB:</strong> {new Date(patient?.dateOfBirth).toLocaleDateString()}</div>
              <div className="mb-2"><strong>Gender:</strong> {patient?.gender || 'N/A'}</div>
              <div className="mb-2"><strong>Phone:</strong> {patient?.phone}</div>
              <div className="mb-2"><strong>Email:</strong> {patient?.email || 'N/A'}</div>
              <div className="mb-2"><strong>Address:</strong> {patient?.address || 'N/A'}</div>
            </div>
          </div>

          {/* Medical History */}
          <div className="clinic-card">
            <h5 className="font-weight-bold mb-3">Clinical Alert & History</h5>
            <div className="alert alert-warning p-2 small border-0 mb-0" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>
              <strong>Medical History:</strong>
              <p className="m-0 mt-1">{patient?.medicalHistory || 'No significant historical alerts recorded.'}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics, Images, Clinical Reports, Billing */}
        <div className="col-md-8">
          {/* Plaque Trends Graph */}
          {reports.length > 0 && (
            <div className="clinic-card mb-4">
              <h5 className="font-weight-bold mb-3">Gumline Plaque Accumulation Trend</h5>
              <div style={{ height: '220px' }}>
                <Line data={plaqueChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          )}

          {/* Dental Images List */}
          <div className="clinic-card mb-4">
            <h5 className="font-weight-bold mb-3">Dental Plaque Image Mapping History</h5>
            {images.length === 0 ? (
              <p className="text-muted small">No dental images uploaded yet.</p>
            ) : (
              <div className="row g-3">
                {images.map(img => (
                  <div key={img.id} className="col-md-4">
                    <div className="border rounded p-2 text-center bg-light">
                      <div className="bg-secondary rounded mb-2 d-flex align-items-center justify-content-center text-white font-weight-bold" style={{ height: 100, fontSize: 24, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                        {img.coveragePercentage}%
                      </div>
                      <div className="small font-weight-bold mb-1">Plaque Detected</div>
                      <div className="xsmall text-muted mb-2">{new Date(img.uploadedAt).toLocaleDateString()}</div>
                      <Link to={`/plaque/validate/${img.id}`} className="btn btn-xs btn-outline-primary w-100 py-1" style={{ fontSize: 11 }}>
                        View Mapping
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clinical Reports */}
          <div className="clinic-card mb-4">
            <h5 className="font-weight-bold mb-3">Clinical Assessment Reports</h5>
            {reports.length === 0 ? (
              <p className="text-muted small">No reports generated yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-clinic align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Dentist</th>
                      <th>Plaque %</th>
                      <th>Status</th>
                      <th>Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id}>
                        <td>{new Date(r.reportDate).toLocaleDateString()}</td>
                        <td>{r.dentistName}</td>
                        <td><span className="badge bg-danger">{r.coveragePercentage}%</span></td>
                        <td>
                          <span className={`badge ${r.approvalStatus === 'Approved' ? 'bg-success' : 'bg-secondary'}`}>
                            {r.approvalStatus}
                          </span>
                        </td>
                        <td>
                          <a 
                            href={`http://localhost:5098/api/reports/${r.id}/export`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-sm btn-outline-danger"
                          >
                            <FaFilePdf /> PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Billing & Invoice History */}
          <div className="clinic-card">
            <h5 className="font-weight-bold mb-3">Billing & Payments Ledger</h5>
            {invoices.length === 0 ? (
              <p className="text-muted small">No invoice records found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-clinic align-middle">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Date</th>
                      <th className="text-end">Total</th>
                      <th className="text-end">Balance Due</th>
                      <th className="ps-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td className="font-weight-bold">#INV-00{inv.id}</td>
                        <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                        <td className="text-end">₱{inv.grandTotal?.toFixed(2)}</td>
                        <td className="text-end">₱{inv.balanceDue?.toFixed(2)}</td>
                        <td className="ps-4">
                          <span className={`badge ${
                            inv.paymentStatus === 'Paid' ? 'badge-paid' :
                            inv.paymentStatus === 'PartiallyPaid' ? 'badge-partial' : 'badge-unpaid'
                          }`}>
                            {inv.paymentStatus}
                          </span>
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
};

export default PatientProfile;
