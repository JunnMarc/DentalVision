import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaFilePdf, FaSearch } from 'react-icons/fa';

const ClinicalReports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    // For MVP prototype list, we can load reports for patients 1-5 to display aggregated data
    try {
      let aggregatedReports = [];
      for (let pId = 1; pId <= 5; pId++) {
        try {
          const response = await api.get(`/reports/patient/${pId}`);
          aggregatedReports = [...aggregatedReports, ...response.data];
        } catch (err) {}
      }
      setReports(aggregatedReports.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Error loading clinical reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => 
    (r.patientName || '').toLowerCase().includes(search.toLowerCase()) || 
    (r.dentistName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h3 className="mb-4 font-weight-bold">Clinical Assessment Reports</h3>

      {/* Search */}
      <div className="clinic-card mb-4 py-3">
        <div className="input-group">
          <span className="input-group-text bg-transparent border-end-0">
            <FaSearch className="text-muted" />
          </span>
          <input 
            type="text" 
            className="form-control border-start-0 ps-0" 
            placeholder="Search by patient name or dentist name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="clinic-card">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : filteredReports.length === 0 ? (
          <p className="text-muted text-center py-4">No clinical reports found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-clinic align-middle">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Patient Name</th>
                  <th>Dentist Name</th>
                  <th>Report Date</th>
                  <th>Plaque %</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(r => (
                  <tr key={r.id}>
                    <td className="font-weight-bold">#REP-00{r.id}</td>
                    <td>{r.patientName}</td>
                    <td>{r.dentistName}</td>
                    <td>{new Date(r.reportDate).toLocaleDateString()}</td>
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
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                      >
                        <FaFilePdf /> Export PDF
                      </a>
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
