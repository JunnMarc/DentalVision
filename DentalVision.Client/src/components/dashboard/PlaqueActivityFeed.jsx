import React from 'react';
import { Link } from 'react-router-dom';
import { FaMicroscope, FaCheckCircle, FaExclamationTriangle, FaEye } from 'react-icons/fa';

export const PlaqueActivityFeed = ({ analyses = [], loading = false }) => {
  return (
    <div className="card shadow-sm border-0 h-100 bg-white" style={{ borderRadius: '16px' }}>
      <div className="card-header bg-white border-0 p-4 pb-2 d-flex justify-content-between align-items-center">
        <h5 className="font-weight-bold text-dark mb-0 d-flex align-items-center gap-2">
          <FaMicroscope className="text-primary" /> AI Plaque Detection Activity
        </h5>
        <Link to="/clinical-reports" className="btn btn-sm btn-link text-primary text-decoration-none p-0 font-weight-bold">
          All Reports →
        </Link>
      </div>
      <div className="card-body p-4 pt-2 text-start">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" role="status" />
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-4 text-muted small bg-light rounded">
            No recent AI scans detected. Upload a dental photo to run plaque segmentation.
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {analyses.slice(0, 6).map((item, idx) => {
              const currentId = item.analysisId || item.id || idx;
              return (
                <div
                  key={currentId}
                  className="list-group-item px-0 py-3 border-bottom d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-teal bg-light"
                      style={{ width: '38px', height: '38px', color: '#0D9488' }}
                    >
                      <FaMicroscope size={15} />
                    </div>
                    <div>
                      <div className="font-weight-bold text-dark small">
                        {item.patientName || `Scan #${currentId}`}
                      </div>
                      <div className="xsmall text-muted">
                        Coverage: <strong>{item.coveragePercentage ? Number(item.coveragePercentage).toFixed(1) : 0}%</strong>
                        {item.confidenceScore ? ` | Confidence: ${(item.confidenceScore * 100).toFixed(0)}%` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    {item.isApproved ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '11px' }}>
                        <FaCheckCircle className="me-1" size={10} /> Validated
                      </span>
                    ) : (
                      <Link
                        to="/consultation"
                        state={{
                          analysisId: currentId,
                          patientId: item.patientId,
                          patientName: item.patientName
                        }}
                        className="btn btn-sm btn-outline-warning text-dark px-2 py-0.5"
                        style={{ fontSize: '11px', fontWeight: 600 }}
                      >
                        Verify in Workspace →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaqueActivityFeed;
