import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaSearch, FaFileMedicalAlt, FaEye } from 'react-icons/fa';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';

export const ClinicalReports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (err) {
      console.error("Error loading clinical reports:", err);
      // Fallback: try querying per patient
      try {
        let aggregated = [];
        for (let pId = 1; pId <= 5; pId++) {
          const r = await api.get(`/reports/patient/${pId}`);
          aggregated = [...aggregated, ...r.data];
        }
        setReports(aggregated);
      } catch (e) {
        console.error("Fallback reports fetch failed:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportPDF = async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}/export`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error("Failed to export clinical report PDF:", err);
      alert("Error generating PDF document. Please verify your login session.");
    }
  };

  const filteredReports = reports.filter(r => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const pat = (r.patientName || '').toLowerCase();
    const den = (r.dentistName || '').toLowerCase();
    const idStr = `rep-00${r.id}`.toLowerCase();
    return pat.includes(term) || den.includes(term) || idStr.includes(term);
  });

  return (
    <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1440px' }}>
      {/* Page Header */}
      <PageHeader
        title="Clinical Assessment & Plaque Reports"
        subtitle="Signed PDF documentation of AI plaque surface area mappings, severity scores, and clinician notes."
        icon={FaFileMedicalAlt}
      />

      {/* Search Bar */}
      <div className="card shadow-sm border-0 p-3 mb-4 bg-white" style={{ borderRadius: '16px' }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-6 col-lg-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <FaSearch size={12} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder="Search by patient, clinician, or report ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="col-md-6 col-lg-8 text-md-end text-muted small">
            Showing <strong>{filteredReports.length}</strong> clinical report{filteredReports.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card shadow-sm border-0 overflow-hidden bg-white" style={{ borderRadius: '16px' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mx-auto mb-2" role="status" />
            <div className="small text-muted">Loading clinical reports...</div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-5 text-muted small">
            No clinical assessment reports on record.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13.5px' }}>
              <thead className="table-light" style={{ backgroundColor: '#F8FAFC' }}>
                <tr>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3">Patient Name</th>
                  <th className="py-3">Attending Clinician</th>
                  <th className="py-3">Assessment Date</th>
                  <th className="py-3">Plaque Coverage</th>
                  <th className="py-3">Verification Status</th>
                  <th className="py-3 text-end px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(r => (
                  <tr key={r.id} className="border-bottom">
                    <td className="py-3 px-4 font-weight-bold text-primary">#REP-00{r.id}</td>
                    <td className="py-3 font-weight-bold text-dark">{r.patientName}</td>
                    <td className="py-3 text-muted">{r.dentistName}</td>
                    <td className="py-3 text-muted">{new Date(r.reportDate).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className="font-weight-bold text-danger">{r.coveragePercentage?.toFixed(1) || 0}%</span>
                    </td>
                    <td className="py-3">
                      <span className={`badge ${r.approvalStatus === 'Approved' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'} px-2.5 py-1 font-weight-bold`}>
                        ● {r.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 text-end px-4">
                      <button 
                        onClick={() => handleExportPDF(r.id)} 
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1 font-weight-bold"
                        style={{ fontSize: '12px' }}
                      >
                        <FaFilePdf /> Export PDF
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
  );
};

export default ClinicalReports;
