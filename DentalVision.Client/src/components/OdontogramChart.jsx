import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaTooth, FaUndo, FaSave, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const toothStatuses = [
  { value: 'Healthy', label: 'Healthy', color: '#10B981', bg: '#E6F4EA', border: '#10B981', fill: '#ffffff', stroke: '#94A3B8' },
  { value: 'Caries', label: 'Caries (Decayed)', color: '#EF4444', bg: '#FEE2E2', border: '#EF4444', fill: '#EF4444', stroke: '#B91C1C' },
  { value: 'Restored', label: 'Restored (Filled)', color: '#3B82F6', bg: '#DBEAFE', border: '#3B82F6', fill: '#3B82F6', stroke: '#1D4ED8' },
  { value: 'Missing', label: 'Missing / Extracted', color: '#64748B', bg: '#F1F5F9', border: '#64748B', fill: '#E2E8F0', stroke: '#64748B' },
  { value: 'BridgeCrown', label: 'Bridge / Crown', color: '#F59E0B', bg: '#FEF3C7', border: '#F59E0B', fill: '#F59E0B', stroke: '#B45309' }
];

export default function OdontogramChart({ patientId }) {
  const [teeth, setTeeth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Modal Editing State
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [editStatus, setEditStatus] = useState('Healthy');
  const [editNotes, setEditNotes] = useState('');

  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerLeft = [38, 37, 36, 35, 34, 33, 32, 31];
  const lowerRight = [41, 42, 43, 44, 45, 46, 47, 48];

  useEffect(() => {
    fetchOdontogram();
  }, [patientId]);

  const fetchOdontogram = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/ToothStatus/patient/${patientId}`);
      setTeeth(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load odontogram data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToothClick = (tooth) => {
    setSelectedTooth(tooth);
    setEditStatus(tooth.status);
    setEditNotes(tooth.notes || '');
  };

  const handleSaveToothSettings = () => {
    setTeeth(prev => prev.map(t => {
      if (t.toothNumber === selectedTooth.toothNumber) {
        return { ...t, status: editStatus, notes: editNotes, updated: true };
      }
      return t;
    }));
    setSelectedTooth(null);
  };

  const handleQuickReset = () => {
    if (window.confirm("Are you sure you want to mark all 32 teeth as Healthy?")) {
      setTeeth(prev => prev.map(t => ({ ...t, status: 'Healthy', notes: '', updated: true })));
    }
  };

  const handleSaveToServer = async () => {
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      // Find all modified teeth
      const updates = teeth.map(t => ({
        toothNumber: t.toothNumber,
        status: t.status,
        notes: t.notes
      }));
      const res = await api.post(`/ToothStatus/patient/${patientId}`, updates);
      setTeeth(res.data || []);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save odontogram updates.');
    } finally {
      setSaving(false);
    }
  };

  const getToothColor = (status) => {
    const config = toothStatuses.find(s => s.value === status);
    return config || toothStatuses[0];
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-2">Loading clinical odontogram...</p>
      </div>
    );
  }

  // Helper to render a single tooth card element in the arches
  const renderToothElement = (toothNum) => {
    const tooth = teeth.find(t => t.toothNumber === toothNum) || { toothNumber: toothNum, status: 'Healthy', notes: '' };
    const styleConfig = getToothColor(tooth.status);
    const isMissing = tooth.status === 'Missing';

    return (
      <div 
        key={toothNum}
        onClick={() => handleToothClick(tooth)}
        className="d-flex flex-column align-items-center justify-content-between p-2 m-1 rounded tooth-box-container"
        style={{
          width: '54px',
          minHeight: '95px',
          backgroundColor: '#ffffff',
          border: `2px solid ${styleConfig.border}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          position: 'relative'
        }}
        title={`Tooth #${toothNum} (${styleConfig.label})${tooth.notes ? ': ' + tooth.notes : ''}`}
      >
        <span className="small font-weight-bold text-secondary mb-1">#{toothNum}</span>
        
        {/* SVG stylized representation of individual tooth */}
        <div className="my-1 d-flex align-items-center justify-content-center" style={{ position: 'relative', width: '28px', height: '36px' }}>
          {isMissing ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={styleConfig.stroke} strokeWidth="3">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          ) : (
            <svg width="28" height="32" viewBox="0 0 24 28" fill="none">
              {/* Tooth Crown boundary */}
              <path 
                d="M4,8 Q4,3 12,3 Q20,3 20,8 Q20,16 18,22 Q16,25 12,25 Q8,25 6,22 Q4,16 4,8 Z" 
                fill={styleConfig.bg} 
                stroke={styleConfig.stroke} 
                strokeWidth="2" 
              />
              {/* Inner core / Pulp visualization */}
              {tooth.status === 'Caries' && (
                <circle cx="12" cy="11" r="4" fill="#EF4444" />
              )}
              {tooth.status === 'Restored' && (
                <rect x="9" y="8" width="6" height="6" rx="1" fill="#3B82F6" />
              )}
              {tooth.status === 'BridgeCrown' && (
                <path d="M7,12 L17,12 L14,7 L10,7 Z" fill="#F59E0B" />
              )}
            </svg>
          )}
        </div>

        {/* Small indicator label */}
        <span 
          className="xsmall font-weight-bold text-white px-1 py-0.5 rounded mt-1"
          style={{ backgroundColor: styleConfig.color, fontSize: '8px' }}
        >
          {tooth.status === 'BridgeCrown' ? 'Crown' : tooth.status}
        </span>
      </div>
    );
  };

  return (
    <div className="clinic-card">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div>
          <h4 className="font-weight-bold mb-1 text-primary">Patient Interactive Odontogram</h4>
          <p className="text-muted small m-0">Click any tooth to configure status records, treatment restorations, or decay levels.</p>
        </div>
        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
          <button onClick={handleQuickReset} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
            <FaUndo size={12} /> Reset to Healthy
          </button>
          <button 
            onClick={handleSaveToServer} 
            disabled={saving} 
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          >
            {saving ? (
              <span className="spinner-border spinner-border-sm" />
            ) : saveSuccess ? (
              <FaCheck size={12} />
            ) : (
              <FaSave size={12} />
            )}
            {saveSuccess ? 'Saved!' : 'Save Chart'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 p-2 small mb-3">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* Legend Block */}
      <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap mb-4 p-2 bg-light rounded border">
        <span className="xsmall font-weight-bold text-muted">LEGEND:</span>
        {toothStatuses.map(s => (
          <div key={s.value} className="d-flex align-items-center gap-1.5">
            <div style={{ width: '12px', height: '12px', backgroundColor: s.bg, border: `2.5px solid ${s.border}`, borderRadius: '3px' }} />
            <span className="xsmall font-weight-semibold text-secondary" style={{ fontSize: '11px' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ODONTOGRAM PLOT VIEW (FDI 32 Teeth Layout) */}
      <div className="d-flex flex-column overflow-auto pb-3 gap-4" style={{ minWidth: '950px' }}>
        
        {/* UPPER ARCH (Maxilla) */}
        <div>
          <h6 className="text-muted font-weight-bold text-center border-bottom pb-1 mb-2">UPPER ARCH (MAXILLA)</h6>
          
          <div className="d-flex justify-content-center">
            {/* Upper Right Quadrant (18 - 11) */}
            <div className="d-flex bg-light p-1 rounded-start border-start border-top border-bottom">
              {upperRight.map(num => renderToothElement(num))}
            </div>
            
            {/* Midline divider */}
            <div className="border-start border-primary border-2 mx-1" style={{ opacity: 0.5 }} />
            
            {/* Upper Left Quadrant (21 - 28) */}
            <div className="d-flex bg-light p-1 rounded-end border-end border-top border-bottom">
              {upperLeft.map(num => renderToothElement(num))}
            </div>
          </div>
        </div>

        {/* LOWER ARCH (Mandible) */}
        <div>
          <div className="d-flex justify-content-center">
            {/* Lower Right Quadrant (48 - 41) */}
            <div className="d-flex bg-light p-1 rounded-start border-start border-top border-bottom">
              {lowerRight.map(num => renderToothElement(num)).reverse()}
            </div>
            
            {/* Midline divider */}
            <div className="border-start border-primary border-2 mx-1" style={{ opacity: 0.5 }} />
            
            {/* Lower Left Quadrant (31 - 38) */}
            <div className="d-flex bg-light p-1 rounded-end border-end border-top border-bottom">
              {lowerLeft.map(num => renderToothElement(num))}
            </div>
          </div>
          
          <h6 className="text-muted font-weight-bold text-center border-top pt-2 mt-2">LOWER ARCH (MANDIBLE)</h6>
        </div>

      </div>

      {/* Edit Tooth Condition Modal Dialog */}
      {selectedTooth && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          role="dialog" 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.42)', backdropFilter: 'blur(3px)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-primary text-white" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <h5 className="modal-title font-weight-bold">
                  Configure Tooth #{selectedTooth.toothNumber} Status
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setSelectedTooth(null)}
                />
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label font-weight-semibold text-secondary">Clinical Condition Status</label>
                  <div className="d-flex flex-column gap-2">
                    {toothStatuses.map(statusOpt => (
                      <label 
                        key={statusOpt.value} 
                        className={`d-flex align-items-center justify-content-between p-2.5 rounded border click-box-label`}
                        style={{
                          cursor: 'pointer',
                          borderColor: editStatus === statusOpt.value ? statusOpt.color : '#e2e8f0',
                          backgroundColor: editStatus === statusOpt.value ? statusOpt.bg : '#ffffff',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <input 
                            type="radio" 
                            name="toothStatusOpt"
                            value={statusOpt.value}
                            checked={editStatus === statusOpt.value}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="form-check-input mt-0"
                          />
                          <span className="small font-weight-semibold text-dark">{statusOpt.label}</span>
                        </div>
                        <FaTooth color={statusOpt.color} />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label font-weight-semibold text-secondary">Clinical Notes / Restorations</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Enter decay surface notes, restoration materials (e.g. glass ionomer, composite), or surgery notes..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  />
                </div>
              </div>
              <div className="modal-footer bg-light" style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedTooth(null)}
                  style={{ borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSaveToothSettings}
                  style={{ borderRadius: '8px' }}
                >
                  Confirm Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
