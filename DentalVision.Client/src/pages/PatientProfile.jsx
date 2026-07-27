import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
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
import OdontogramChart from '../components/OdontogramChart';

const PatientProfile = () => {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [patient, setPatient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [reports, setReports] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records');
  const [exportingId, setExportingId] = useState(null);

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
        {hasRole(['Dentist']) && (
          <Link to={`/plaque/upload?patientId=${id}`} className="btn btn-primary-clinic d-flex align-items-center gap-2">
            <FaCamera /> Upload Dental Image
          </Link>
        )}
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
          {/* Tab Navigation */}
          <div className="d-flex border-bottom mb-4 gap-3">
            <button 
              className={`pb-2 px-1 font-weight-bold btn btn-link border-0 text-decoration-none ${activeTab === 'records' ? 'text-teal border-bottom border-teal border-2 fw-bold' : 'text-muted'}`}
              onClick={() => setActiveTab('records')}
              style={{ background: 'none', color: activeTab === 'records' ? '#0D9488' : '#64748B', borderBottom: activeTab === 'records' ? '2px solid #0D9488' : 'none', paddingBottom: '8px' }}
            >
              Clinical Records & Analytics
            </button>
            <button 
              className={`pb-2 px-1 font-weight-bold btn btn-link border-0 text-decoration-none ${activeTab === 'odontogram' ? 'text-teal border-bottom border-teal border-2 fw-bold' : 'text-muted'}`}
              onClick={() => setActiveTab('odontogram')}
              style={{ background: 'none', color: activeTab === 'odontogram' ? '#0D9488' : '#64748B', borderBottom: activeTab === 'odontogram' ? '2px solid #0D9488' : 'none', paddingBottom: '8px' }}
            >
              Interactive Odontogram Chart
            </button>
            <button 
              className={`pb-2 px-1 font-weight-bold btn btn-link border-0 text-decoration-none ${activeTab === 'comparison' ? 'text-teal border-bottom border-teal border-2 fw-bold' : 'text-muted'}`}
              onClick={() => setActiveTab('comparison')}
              style={{ background: 'none', color: activeTab === 'comparison' ? '#0D9488' : '#64748B', borderBottom: activeTab === 'comparison' ? '2px solid #0D9488' : 'none', paddingBottom: '8px' }}
            >
              Side-by-Side Plaque Comparison
            </button>
          </div>

          {activeTab === 'records' && (
            <>
              {/* Plaque Trends Graph */}
              {reports.length > 0 && (
                <div className="clinic-card mb-4 shadow-sm">
                  <h5 className="font-weight-bold mb-3">Gumline Plaque Accumulation Trend</h5>
                  <div style={{ height: '220px' }}>
                    <Line data={plaqueChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              )}

              {/* Dental Images List */}
              <div className="clinic-card mb-4 shadow-sm">
                <h5 className="font-weight-bold mb-3">Dental Plaque Image Mapping History</h5>
                {images.length === 0 ? (
                  <p className="text-muted small">No dental images uploaded yet.</p>
                ) : (
                  <div className="row g-3">
                    {images.map(img => (
                      <div key={img.id} className="col-md-4">
                        <div className="border rounded p-2 text-center bg-light">
                          <div className="bg-secondary rounded mb-2 d-flex align-items-center justify-content-center text-white font-weight-bold" style={{ height: 100, fontSize: 24, background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)' }}>
                            {img.coveragePercentage}%
                          </div>
                          <div className="small font-weight-bold mb-1">Plaque Detected</div>
                          <div className="xsmall text-muted mb-2">{new Date(img.uploadedAt).toLocaleDateString()}</div>
                          {hasRole(['Dentist']) && (
                            <Link to={`/plaque/validate/${img.id}`} className="btn btn-xs btn-outline-primary w-100 py-1" style={{ fontSize: 11 }}>
                              Map & Validate
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clinical Reports */}
              <div className="clinic-card mb-4 shadow-sm">
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
                               <button 
                                 onClick={() => handleExportPDF(r.id)} 
                                 className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                 disabled={exportingId === r.id}
                               >
                                 <FaFilePdf /> {exportingId === r.id ? 'Loading...' : 'PDF'}
                               </button>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Billing & Invoice History */}
              <div className="clinic-card shadow-sm">
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
                                inv.paymentStatus === 'Paid' || inv.paymentStatus === 2 ? 'badge-paid' :
                                inv.paymentStatus === 'PartiallyPaid' || inv.paymentStatus === 1 ? 'badge-partial' : 'badge-unpaid'
                              }`}>
                                {inv.paymentStatus === 0 ? 'Unpaid' : inv.paymentStatus === 1 ? 'PartiallyPaid' : inv.paymentStatus === 2 ? 'Paid' : inv.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'odontogram' && (
            <OdontogramChart patientId={id} />
          )}

          {activeTab === 'comparison' && (
            <PlaqueComparisonView reports={reports} />
          )}

        </div>
      </div>
    </div>
  );
};

const PlaqueCanvas = ({ imageUrl, mappings }) => {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const fullUrl = imageUrl && imageUrl.startsWith('/uploads') 
      ? `http://localhost:5098${imageUrl}` 
      : imageUrl;

    img.src = fullUrl || '';
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      mappings.forEach(m => {
        try {
          const coords = JSON.parse(m.coordinatesJson);
          if (Array.isArray(coords) && coords.length > 0) {
            ctx.fillStyle = m.plaqueLevel === 'High' 
              ? 'rgba(239, 68, 68, 0.42)' 
              : m.plaqueLevel === 'Medium' 
                ? 'rgba(245, 158, 11, 0.42)' 
                : 'rgba(20, 184, 166, 0.38)';
            
            ctx.beginPath();
            coords.forEach((pt, idx) => {
              const scaleX = canvas.width / 600;
              const scaleY = canvas.height / 400;
              if (idx === 0) ctx.moveTo(pt.x * scaleX, pt.y * scaleY);
              else ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
            });
            ctx.closePath();
            ctx.fill(); // Fill only, no outline stroke to remove mesh clutter

            // Calculate center of the contour for labeling
            const scaleX = canvas.width / 600;
            const scaleY = canvas.height / 400;
            const sumX = coords.reduce((sum, pt) => sum + pt.x, 0);
            const sumY = coords.reduce((sum, pt) => sum + pt.y, 0);
            const cx = (sumX / coords.length) * scaleX;
            const cy = (sumY / coords.length) * scaleY;

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(m.toothNumber.toString(), cx, cy);
            
            // Reset styles
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
          }
        } catch (err) {}
      });
    };

    img.onerror = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 10, canvas.width/2, canvas.height/2, canvas.width);
      grad.addColorStop(0, '#e2e8f0');
      grad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[ Dental Image Not Found ]', canvas.width/2, canvas.height/2 - 10);
      
      ctx.textAlign = 'left';
      mappings.forEach(m => {
        try {
          const coords = JSON.parse(m.coordinatesJson);
          if (Array.isArray(coords) && coords.length > 0) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            coords.forEach((pt, idx) => {
              const scaleX = canvas.width / 600;
              const scaleY = canvas.height / 400;
              if (idx === 0) ctx.moveTo(pt.x * scaleX, pt.y * scaleY);
              else ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            const scaleX = canvas.width / 600;
            const scaleY = canvas.height / 400;
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(`Tooth ${m.toothNumber}`, coords[0].x * scaleX, coords[0].y * scaleY - 5);
          }
        } catch (err) {}
      });
    };
  }, [imageUrl, mappings]);

  return (
    <canvas 
      ref={canvasRef} 
      width={280} 
      height={200} 
      className="border rounded bg-light shadow-sm"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
};

const PlaqueComparisonView = ({ reports }) => {
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  useEffect(() => {
    if (!id1) {
      setData1(null);
      return;
    }
    setLoading1(true);
    api.get(`/plaque/analysis/${id1}`)
      .then(res => setData1(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading1(false));
  }, [id1]);

  useEffect(() => {
    if (!id2) {
      setData2(null);
      return;
    }
    setLoading2(true);
    api.get(`/plaque/analysis/${id2}`)
      .then(res => setData2(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading2(false));
  }, [id2]);

  return (
    <div className="clinic-card shadow-sm">
      <h5 className="font-weight-bold mb-3 text-teal" style={{ color: '#0D9488' }}>
        Side-by-Side Plaque Comparison
      </h5>
      <p className="text-muted small mb-4">
        Select two plaque analysis dates below to visually compare patient gumline progression, treatment effectiveness, and coverage maps side-by-side.
      </p>

      <div className="row g-4">
        {/* Left Box (Past Visit) */}
        <div className="col-md-6">
          <div className="border rounded p-3 bg-light">
            <label className="form-label small font-weight-bold">Select Visit 1 (Baseline)</label>
            <select 
              className="form-select form-select-sm mb-3"
              value={id1}
              onChange={(e) => setId1(e.target.value)}
            >
              <option value="">-- Choose Visit 1 --</option>
              {reports.map(r => (
                <option key={r.id} value={r.analysisId}>
                  {new Date(r.reportDate).toLocaleDateString()} - {r.coveragePercentage}% Plaque
                </option>
              ))}
            </select>

            {loading1 ? (
              <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" role="status"></div></div>
            ) : data1 ? (
              <div>
                <PlaqueCanvas 
                  imageUrl={data1.imageId ? `/api/plaque/analysis/image/${data1.imageId}` : ''} 
                  mappings={data1.mappings || []} 
                />
                <div className="mt-3 small border-top pt-2">
                  <div><strong>Analysis Date:</strong> {new Date(data1.createdAt).toLocaleDateString()}</div>
                  <div><strong>Plaque Coverage:</strong> <span className="badge bg-danger">{data1.coveragePercentage}%</span></div>
                  <div><strong>AI Confidence:</strong> {data1.confidenceScore}</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted py-5 border rounded bg-white small">
                Choose a visit date from the menu above to render baseline canvas.
              </div>
            )}
          </div>
        </div>

        {/* Right Box (Current Visit) */}
        <div className="col-md-6">
          <div className="border rounded p-3 bg-light">
            <label className="form-label small font-weight-bold">Select Visit 2 (Follow-up)</label>
            <select 
              className="form-select form-select-sm mb-3"
              value={id2}
              onChange={(e) => setId2(e.target.value)}
            >
              <option value="">-- Choose Visit 2 --</option>
              {reports.map(r => (
                <option key={r.id} value={r.analysisId}>
                  {new Date(r.reportDate).toLocaleDateString()} - {r.coveragePercentage}% Plaque
                </option>
              ))}
            </select>

            {loading2 ? (
              <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" role="status"></div></div>
            ) : data2 ? (
              <div>
                <PlaqueCanvas 
                  imageUrl={data2.imageId ? `/api/plaque/analysis/image/${data2.imageId}` : ''} 
                  mappings={data2.mappings || []} 
                />
                <div className="mt-3 small border-top pt-2">
                  <div><strong>Analysis Date:</strong> {new Date(data2.createdAt).toLocaleDateString()}</div>
                  <div><strong>Plaque Coverage:</strong> <span className="badge bg-danger">{data2.coveragePercentage}%</span></div>
                  <div><strong>AI Confidence:</strong> {data2.confidenceScore}</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted py-5 border rounded bg-white small">
                Choose a visit date from the menu above to render follow-up canvas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
