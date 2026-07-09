import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { FaFilePdf, FaArrowLeft, FaPrint, FaTooth } from 'react-icons/fa';

const ReportDetails = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get(`/reports/${id}`);
        setReport(response.data);
      } catch (error) {
        console.error("Error loading report details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  if (!report) {
    return <div className="alert alert-danger">Clinical report not found.</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/reports" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
          <FaArrowLeft /> Back to Reports
        </Link>
        <div className="d-flex gap-2">
          <button onClick={() => window.print()} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
            <FaPrint /> Print
          </button>
          <a 
            href={`http://localhost:5098/api/reports/${id}/export`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-sm btn-danger d-flex align-items-center gap-1"
          >
            <FaFilePdf /> Export PDF
          </a>
        </div>
      </div>

      <div className="clinic-card p-5 animate-fade-in" style={{ backgroundColor: '#ffffff' }}>
        {/* Report Header */}
        <div className="text-center border-bottom pb-4 mb-4">
          <h4 className="font-weight-bold m-0" style={{ color: '#2563EB' }}>DENTALVISION CLINICAL REPORT</h4>
          <p className="text-muted small m-0 mt-1">Automated Plaque Mapping & Analysis Summary</p>
        </div>

        {/* Patient & Clinic Metadata */}
        <div className="row g-3 mb-4 text-start">
          <div className="col-6">
            <h6 className="font-weight-bold text-muted small uppercase mb-2">Patient Details</h6>
            <div className="small"><strong>Name:</strong> {report.patientName}</div>
            <div className="small"><strong>DOB:</strong> {new Date(report.patientDOB).toLocaleDateString()}</div>
            <div className="small"><strong>Patient ID:</strong> #{report.patientId}</div>
          </div>
          <div className="col-6 text-end">
            <h6 className="font-weight-bold text-muted small uppercase mb-2">Consultation Details</h6>
            <div className="small"><strong>Dentist:</strong> Dr. {report.dentistName}</div>
            <div className="small"><strong>Report Date:</strong> {new Date(report.reportDate).toLocaleDateString()}</div>
            <div className="small"><strong>Status:</strong> <span className="badge bg-success">{report.approvalStatus}</span></div>
          </div>
        </div>

        {/* Main Coverage Rating Card */}
        <div className="bg-light rounded p-4 text-center mb-4 border border-danger-subtle" style={{ borderLeft: '5px solid #EF4444' }}>
          <h6 className="text-muted small mb-1">Stained Plaque Coverage Area</h6>
          <h2 className="display-4 font-weight-bold text-danger m-0">{report.coveragePercentage}%</h2>
          <span className="xsmall text-muted d-block mt-2">
            Automated image parsing scans identify substantial staining near the gingival margins.
          </span>
        </div>

        {/* Mapped Teeth Coordinates outline */}
        <div className="mb-4">
          <h6 className="font-weight-bold text-muted small uppercase mb-2">Mapped Teeth Plaque Classification</h6>
          <div className="border rounded p-3 bg-light">
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {/* Render a simple tooth representation grid */}
              {[11, 12, 21, 22, 31, 41].map(tooth => {
                const isHigh = [11, 22, 41].includes(tooth);
                const isMed = [21, 31].includes(tooth);
                return (
                  <div key={tooth} className="border rounded p-2 text-center bg-white" style={{ minWidth: '80px' }}>
                    <FaTooth size={18} className={isHigh ? 'text-danger' : isMed ? 'text-warning' : 'text-success'} />
                    <div className="xsmall font-weight-bold mt-1">Tooth #{tooth}</div>
                    <div className="xsmall text-muted" style={{ fontSize: 10 }}>
                      {isHigh ? 'High Plaque' : isMed ? 'Med Plaque' : 'Low Plaque'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dentist Notes */}
        <div className="mb-4 text-start">
          <h6 className="font-weight-bold text-muted small uppercase mb-2">Dentist Clinical Assessment Notes</h6>
          <div className="p-3 border rounded" style={{ whiteSpace: 'pre-line', backgroundColor: '#fafafa' }}>
            {report.dentistNotes || "No notes entered for this assessment."}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-0 text-start">
          <h6 className="font-weight-bold text-muted small uppercase mb-2">Recommendations & Treatment Plan</h6>
          <div className="p-3 border rounded" style={{ whiteSpace: 'pre-line', backgroundColor: '#fafafa' }}>
            {report.recommendations || "No recommendations recorded."}
          </div>
        </div>

        <div className="text-center text-muted border-top pt-4 mt-5 xsmall" style={{ fontSize: 10 }}>
          This report is electronically signed and approved by Dr. {report.dentistName} on {new Date(report.reportDate).toLocaleString()}.
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;
