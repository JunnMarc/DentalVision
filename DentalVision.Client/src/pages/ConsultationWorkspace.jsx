import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  FaTooth,
  FaMicroscope,
  FaNotesMedical,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaFilePdf,
  FaArrowLeft,
  FaCloudUploadAlt,
  FaUndo,
  FaTrash,
  FaSave,
  FaCheck
} from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import usePatients from '../hooks/usePatients';
import PageHeader from '../components/common/PageHeader';
import OdontogramChart from '../components/OdontogramChart';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

const FDI_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  38, 37, 36, 35, 34, 33, 32, 31, 48, 47, 46, 45, 44, 43, 42, 41
];

const STANDARD_PROCEDURES = [
  { id: 'prophylaxis', name: 'Oral Prophylaxis (Cleaning)', defaultPrice: 800 },
  { id: 'deep_scaling', name: 'Deep Subgingival Scaling', defaultPrice: 1500 },
  { id: 'composite_fill', name: 'Composite Dental Restoration / Filling', defaultPrice: 1200 },
  { id: 'fluoride', name: 'Topical Fluoride Application', defaultPrice: 500 },
  { id: 'extraction', name: 'Tooth Extraction (Simple)', defaultPrice: 1000 },
  { id: 'pit_fissure', name: 'Pit & Fissure Sealants', defaultPrice: 600 }
];

export const ConsultationWorkspace = () => {
  const { appointmentId, analysisId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { patients } = usePatients();

  // Active Context
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('odontogram');
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Plaque Analysis & Canvas State
  const [analysis, setAnalysis] = useState(null);
  const [imagePath, setImagePath] = useState('');
  const [mappings, setMappings] = useState([]);
  const [coveragePercentage, setCoveragePercentage] = useState(0);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const canvasRef = useRef(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Clinical Notes & Procedures Billing State
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [severityAdjustment, setSeverityAdjustment] = useState('none');
  const [customPrice, setCustomPrice] = useState('');
  const [specialTools, setSpecialTools] = useState('');
  const [selectedProcedures, setSelectedProcedures] = useState(['prophylaxis']);

  // Completion State
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [consultationCompleted, setConsultationCompleted] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // 1. Initial Data Loading
  useEffect(() => {
    const initWorkspace = async () => {
      setLoading(true);
      try {
        let activePatientId = searchParams.get('patientId') || location.state?.patientId;
        let activeApptId = appointmentId || location.state?.appointmentId;
        let activeAnalysisId = analysisId || location.state?.analysisId;

        // Load Appointment if available
        if (activeApptId) {
          try {
            const apptRes = await api.get(`/appointments/${activeApptId}`);
            setAppointment(apptRes.data);
            if (!activePatientId && apptRes.data.patientId) {
              activePatientId = apptRes.data.patientId;
            }
          } catch (e) {
            console.warn("Could not load specific appointment:", e);
          }
        }

        // Load Patient profile
        if (activePatientId) {
          try {
            const pRes = await api.get(`/patients/${activePatientId}`);
            setPatient(pRes.data);
          } catch (e) {
            console.warn("Could not load patient details:", e);
          }
        }

        // Load Plaque Analysis if provided
        if (activeAnalysisId) {
          try {
            const aRes = await api.get(`/plaque/analysis/${activeAnalysisId}`);
            setAnalysis(aRes.data);
            setCoveragePercentage(aRes.data.coveragePercentage || 0);
            setMappings(aRes.data.mappings || []);
            if (aRes.data.imageId) {
              const imgRes = await api.get(`/plaque/analysis/image/${aRes.data.imageId}`, { responseType: 'blob' });
              setImagePath(URL.createObjectURL(imgRes.data));
            }
          } catch (e) {
            console.warn("Could not load existing plaque analysis:", e);
          }
        }
      } catch (err) {
        console.error("Workspace init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initWorkspace();
  }, [appointmentId, analysisId, location.state, searchParams]);

  // 2. Handle Plaque Image Upload and AI Analysis inside workspace
  const handlePlaqueUploadAndAnalyze = async (e) => {
    e.preventDefault();
    const targetPatientId = patient?.id || appointment?.patientId;
    if (!targetPatientId) {
      showNotification("Please select a patient before running AI plaque segmentation.", "danger");
      return;
    }
    if (!uploadFile) {
      showNotification("Please select a dental image to analyze.", "warning");
      return;
    }

    try {
      setIsAnalyzing(true);
      const formData = new FormData();
      formData.append('PatientId', targetPatientId);
      formData.append('File', uploadFile);
      formData.append('Notes', `Consultation scan for ${patient?.firstName || 'Patient'}`);

      const response = await api.post('/plaque/upload-and-analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;
      setAnalysis(data.analysis || { id: data.analysisId });
      const cov = data.analysis?.coveragePercentage || 14.5;
      const mapList = data.analysis?.mappings || [];
      setCoveragePercentage(cov);
      setMappings(mapList);

      if (data.imageId) {
        const imgRes = await api.get(`/plaque/analysis/image/${data.imageId}`, { responseType: 'blob' });
        setImagePath(URL.createObjectURL(imgRes.data));
      } else if (uploadPreview) {
        setImagePath(uploadPreview);
      }

      // Automatically suggest dental procedures based on clinical plaque findings
      const suggested = [];
      if (cov > 8) suggested.push('prophylaxis');
      if (mapList.some(m => m.plaqueLevel === 'High' && m.gumlineRegion?.includes('Cervical'))) {
        suggested.push('deep_scaling');
      }
      if (cov > 20) suggested.push('fluoride');
      if (suggested.length > 0) {
        setSelectedProcedures(prev => Array.from(new Set([...prev, ...suggested])));
      }

      if (!clinicalNotes) {
        setClinicalNotes(`Intraoral disclosing examination reveals ${cov}% plaque biofilm index. Significant subgingival/cervical plaque noted along the gingival margin. Periodontal prophylaxis and subgingival scaling recommended.`);
      }
      if (!recommendations) {
        setRecommendations("1. Twice-daily modified Bass brushing technique targeting the gumline.\n2. Daily interdental flossing or water flosser.\n3. 0.12% Chlorhexidine gluconate oral rinse for 7 days post-cleaning.");
      }

      showNotification("AI Plaque Detection successfully executed! Findings mapped to Clinical Workspace.");
    } catch (err) {
      console.error("AI Analysis error:", err);
      showNotification(err.response?.data?.message || "AI Analysis failed to process image.", "danger");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Canvas Redraw for Plaque Markers
  useEffect(() => {
    if (!canvasRef.current || !mappings) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Heatmap polygons
    mappings.forEach(m => {
      try {
        const coords = JSON.parse(m.coordinatesJson);
        if (Array.isArray(coords) && coords.length > 0) {
          ctx.fillStyle = m.plaqueLevel === 'High'
            ? 'rgba(0, 255, 0, 0.52)'
            : m.plaqueLevel === 'Medium'
              ? 'rgba(50, 255, 50, 0.42)'
              : 'rgba(100, 255, 100, 0.32)';
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.75)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          coords.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          if (coords.length > 2) ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } catch (e) {}
    });

    // Draw Anchor Points
    mappings.forEach(m => {
      try {
        const coords = JSON.parse(m.coordinatesJson);
        if (Array.isArray(coords)) {
          coords.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          });
        }
      } catch (e) {}
    });
  }, [mappings, activeTab]);

  // Aggregated mappings per tooth for clean clinical overview
  const aggregatedMappings = useMemo(() => {
    const map = new Map();
    mappings.forEach((m, origIdx) => {
      const num = m.toothNumber || 'Unknown';
      if (!map.has(num)) {
        map.set(num, {
          toothNumber: num,
          plaqueLevel: m.plaqueLevel || 'Low',
          regions: new Set([m.gumlineRegion || 'Cervical']),
          indices: [origIdx]
        });
      } else {
        const entry = map.get(num);
        entry.indices.push(origIdx);
        if (m.gumlineRegion) entry.regions.add(m.gumlineRegion);
        if (m.plaqueLevel === 'High' || (m.plaqueLevel === 'Medium' && entry.plaqueLevel === 'Low')) {
          entry.plaqueLevel = m.plaqueLevel;
        }
      }
    });
    return Array.from(map.values()).map(e => ({
      ...e,
      regionsStr: Array.from(e.regions).join(', ')
    }));
  }, [mappings]);

  // Canvas Click to Add / Edit Node
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;

    let foundNode = null;
    mappings.forEach(m => {
      try {
        const coords = JSON.parse(m.coordinatesJson);
        if (Array.isArray(coords)) {
          coords.forEach((pt, idx) => {
            const dist = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
            if (dist < 15) {
              foundNode = {
                x: pt.x,
                y: pt.y,
                displayX,
                displayY,
                toothNumber: m.toothNumber,
                plaqueLevel: m.plaqueLevel,
                gumlineRegion: m.gumlineRegion,
                isEdit: true,
                originalCoordIndex: idx,
                originalMapping: m
              };
            }
          });
        }
      } catch (err) {}
    });

    if (foundNode) {
      setActiveTooltip(foundNode);
    } else {
      setActiveTooltip({
        x,
        y,
        displayX,
        displayY,
        toothNumber: 11,
        plaqueLevel: 'High',
        gumlineRegion: 'Cervical',
        isEdit: false
      });
    }
  };

  const handleSaveTooltipNode = () => {
    if (!activeTooltip) return;
    const { x, y, toothNumber, plaqueLevel, gumlineRegion, isEdit } = activeTooltip;

    const targetMapping = mappings.find(m => m.toothNumber === toothNumber);
    if (targetMapping) {
      const coords = JSON.parse(targetMapping.coordinatesJson || '[]');
      coords.push({ x, y });
      targetMapping.coordinatesJson = JSON.stringify(coords);
      setMappings([...mappings]);
    } else {
      const newMapping = {
        toothNumber,
        plaqueLevel,
        gumlineRegion,
        coordinatesJson: JSON.stringify([{ x, y }])
      };
      setMappings([...mappings, newMapping]);
    }
    setCoveragePercentage(prev => Math.min(100, Math.round((parseFloat(prev) + 1.2) * 10) / 10));
    setActiveTooltip(null);
  };

  // Toggle procedure selection
  const handleToggleProcedure = (procId) => {
    setSelectedProcedures(prev =>
      prev.includes(procId) ? prev.filter(p => p !== procId) : [...prev, procId]
    );
  };

  // 4. Complete & Finish Entire Consultation
  const handleCompleteConsultation = async () => {
    setCompleting(true);
    try {
      const targetPatientId = patient?.id || appointment?.patientId;
      const targetApptId = appointment?.id;

      // 1. Build billing notes recommendation
      let finalRecommendations = recommendations || 'Standard oral hygiene instructions provided.';
      let extraFee = 0;
      let reasonDetails = selectedProcedures
        .map(id => STANDARD_PROCEDURES.find(p => p.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      if (severityAdjustment === 'moderate') {
        extraFee += 1000;
        reasonDetails += ' + Moderate Deep Scaling (+₱1,000)';
      } else if (severityAdjustment === 'severe') {
        extraFee += 2000;
        reasonDetails += ' + Severe Ultrasonic Scaling (+₱2,000)';
      } else if (severityAdjustment === 'custom') {
        extraFee += parseFloat(customPrice) || 0;
        reasonDetails += ` + Custom Adjustment (+₱${customPrice})`;
      }

      if (specialTools.trim()) {
        reasonDetails += ` (Tools: ${specialTools.trim()})`;
      }

      finalRecommendations += `\n\n[ClinicalProcedures: ${reasonDetails} | TotalRecAmount: ₱${extraFee}]`;

      // 2. Validate plaque analysis if exists
      if (analysis?.id) {
        try {
          const payload = {
            approvedPercentage: parseFloat(coveragePercentage) || 12.0,
            approvedRegions: JSON.stringify(mappings.map(m => ({ tooth: m.toothNumber }))),
            mappings: mappings.map(m => ({
              toothNumber: m.toothNumber,
              plaqueLevel: m.plaqueLevel || 'Medium',
              gumlineRegion: m.gumlineRegion || 'Cervical',
              coordinatesJson: m.coordinatesJson
            })),
            dentistNotes: clinicalNotes || 'Completed during clinical consultation.',
            recommendations: finalRecommendations
          };
          await api.post(`/plaque/analysis/${analysis.id}/validate`, payload);
        } catch (e) {
          console.warn("Could not validate plaque analysis record:", e);
        }
      }

      // 3. Update appointment status to Completed (1)
      if (targetApptId) {
        try {
          await api.put(`/appointments/${targetApptId}/status`, { status: 1 });
        } catch (e) {
          console.warn("Could not mark appointment status completed:", e);
        }
      }

      // 4. Retrieve newly created or latest report ID
      if (targetPatientId) {
        try {
          const repRes = await api.get(`/reports/patient/${targetPatientId}`);
          if (repRes.data && repRes.data.length > 0) {
            setGeneratedReportId(repRes.data[0].id);
          }
        } catch (e) {}
      }

      setConsultationCompleted(true);
      setShowCompleteModal(false);
      showNotification("Consultation successfully completed! Billing recommendation generated for reception.");
    } catch (err) {
      console.error("Error completing consultation:", err);
      showNotification("Failed to finalize consultation records.", "danger");
    } finally {
      setCompleting(false);
    }
  };

  const handleExportPDF = async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}/export`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      alert("Error generating PDF clinical report.");
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-5 text-center">
        <div className="spinner-border text-primary mx-auto mb-2" role="status" />
        <div className="small text-muted">Initializing Clinical Workspace...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1440px' }}>
      {/* Toast Alert */}
      {toast && (
        <div
          className={`alert alert-${toast.type} shadow-sm border-0 d-flex align-items-center justify-content-between position-fixed top-0 end-0 m-4`}
          style={{ zIndex: 1100, minWidth: '320px', borderRadius: '12px' }}
        >
          <div className="d-flex align-items-center gap-2">
            {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            <span className="small font-weight-bold">{toast.message}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setToast(null)} />
        </div>
      )}

      {/* Top Header & Patient Summary Banner */}
      <div className="card shadow-sm border-0 mb-4 bg-white" style={{ borderRadius: '16px' }}>
        <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <Link to="/appointments" className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
              <FaArrowLeft size={13} />
            </Link>
            <div
              className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
              style={{ width: 48, height: 48 }}
            >
              <FaTooth size={22} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="font-weight-bold text-dark mb-0">
                  {patient ? `${patient.firstName} ${patient.lastName}` : (appointment?.patientName || 'Patient Consultation')}
                </h4>
                <span className="badge bg-light text-muted border px-2 py-0.5 small">
                  {patient?.patientCode || (appointment?.patientCode || 'PAT-ID')}
                </span>
                {appointment && (
                  <StatusBadge type="appointment" status={appointment.status} />
                )}
              </div>
              <div className="text-muted small mt-1 d-flex align-items-center gap-3 flex-wrap">
                {patient?.dateOfBirth && (
                  <span><strong>DOB:</strong> {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                )}
                {patient?.gender && <span><strong>Gender:</strong> {patient.gender}</span>}
                {appointment?.reason && <span><strong>Reason:</strong> {appointment.reason}</span>}
              </div>
            </div>
          </div>

          {/* Known Allergies Warning */}
          {patient?.allergies ? (
            <div className="alert alert-danger mb-0 py-1 px-3 d-flex align-items-center gap-2 border-0 shadow-sm" style={{ borderRadius: '10px', fontSize: '13px' }}>
              <FaExclamationTriangle className="text-danger" />
              <div>
                <strong>Allergies:</strong> {patient.allergies}
              </div>
            </div>
          ) : (
            <div className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
              ✓ No Known Allergies
            </div>
          )}

          {/* Action Complete Button */}
          <div className="d-flex gap-2">
            {!consultationCompleted ? (
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2 font-weight-bold px-4 py-2 shadow-sm"
                onClick={() => setShowCompleteModal(true)}
              >
                <FaCheckCircle /> Complete Consultation
              </button>
            ) : (
              <div className="d-flex gap-2">
                {generatedReportId && (
                  <button
                    type="button"
                    className="btn btn-outline-danger d-flex align-items-center gap-2 px-3"
                    onClick={() => handleExportPDF(generatedReportId)}
                  >
                    <FaFilePdf /> Export PDF Report
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-secondary px-3"
                  onClick={() => navigate('/appointments')}
                >
                  Return to Schedule
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card-footer bg-white border-top px-4 py-0">
          <ul className="nav nav-tabs border-0 gap-4" style={{ fontSize: '14.5px', fontWeight: '600' }}>
            <li className="nav-item">
              <button
                className={`nav-link border-0 py-3 d-flex align-items-center gap-2 ${activeTab === 'odontogram' ? 'text-primary border-bottom border-primary border-3 active' : 'text-muted'}`}
                onClick={() => setActiveTab('odontogram')}
                style={{ background: 'none' }}
              >
                <FaTooth /> 1. Odontogram (Tooth Chart)
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 py-3 d-flex align-items-center gap-2 ${activeTab === 'plaque' ? 'text-primary border-bottom border-primary border-3 active' : 'text-muted'}`}
                onClick={() => setActiveTab('plaque')}
                style={{ background: 'none' }}
              >
                <FaMicroscope /> 2. AI Plaque Scanner {coveragePercentage > 0 && <span className="badge bg-danger-subtle text-danger ms-1">{coveragePercentage}%</span>}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 py-3 d-flex align-items-center gap-2 ${activeTab === 'treatment' ? 'text-primary border-bottom border-primary border-3 active' : 'text-muted'}`}
                onClick={() => setActiveTab('treatment')}
                style={{ background: 'none' }}
              >
                <FaNotesMedical /> 3. Treatment Notes & Billing Recommendations
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* TAB 1: Odontogram Chart */}
      {activeTab === 'odontogram' && (
        <div className="animate-fade-in">
          {patient?.id || appointment?.patientId ? (
            <OdontogramChart patientId={patient?.id || appointment?.patientId} />
          ) : (
            <div className="card shadow-sm border-0 p-5 text-center bg-white" style={{ borderRadius: '16px' }}>
              <p className="text-muted mb-0">Select a patient to view and update tooth charting conditions.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI Plaque Scanner & Interactive Contour Editor */}
      {activeTab === 'plaque' && (
        <div className="row g-4 animate-fade-in">
          {/* Left: Canvas & Upload Area */}
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: '16px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="font-weight-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <FaMicroscope className="text-primary" /> Plaque Boundary & Contour Editor
                </h5>
                {mappings.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                    onClick={() => { setMappings([]); setCoveragePercentage(0); }}
                  >
                    <FaUndo size={11} /> Reset Map
                  </button>
                )}
              </div>

              {!imagePath ? (
                <div className="border border-dashed rounded p-5 text-center bg-light">
                  <FaCloudUploadAlt size={48} className="text-primary mb-3" />
                  <h6 className="font-weight-bold text-dark">Upload Dental Disclosing Photo</h6>
                  <p className="text-muted small mb-3">
                    Upload a clinical photo with disclosing dye for automated AI plaque segmentation and FDI tooth mapping.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    id="plaque-photo-upload"
                    className="d-none"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setUploadFile(e.target.files[0]);
                        setUploadPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                  <div className="d-flex justify-content-center gap-2">
                    <label htmlFor="plaque-photo-upload" className="btn btn-outline-primary btn-sm px-4">
                      Choose Photo File
                    </label>
                    {uploadFile && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm px-4 font-weight-bold"
                        onClick={handlePlaqueUploadAndAnalyze}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? 'Scanning Neural Network...' : 'Run AI Analysis 🚀'}
                      </button>
                    )}
                  </div>
                  {uploadFile && (
                    <div className="text-muted xsmall mt-2">Selected: {uploadFile.name}</div>
                  )}
                </div>
              ) : (
                <div className="position-relative overflow-hidden rounded border shadow-sm" style={{ width: '100%', aspectRatio: '3 / 2', backgroundColor: '#0B0F19' }}>
                  {/* Photo Layer */}
                  <img
                    src={imagePath}
                    alt="Dental Disclosing Clinical Scan"
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{ objectFit: 'fill' }}
                  />
                  {/* Interactive Canvas Overlay */}
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={400}
                    onClick={handleCanvasClick}
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{ cursor: 'crosshair', zIndex: 10 }}
                  />

                  {/* Hotspot Annotation Tooltip */}
                  {activeTooltip && (
                    <div
                      className="shadow-lg border p-3 rounded position-absolute"
                      style={{
                        left: `${activeTooltip.displayX}px`,
                        top: `${activeTooltip.displayY}px`,
                        transform: 'translate(-50%, -100%) translateY(-12px)',
                        backgroundColor: '#0F172A',
                        color: '#ffffff',
                        zIndex: 100,
                        width: '210px',
                        borderRadius: '12px'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-secondary">
                        <span className="small font-weight-bold">Annotate Plaque Spot</span>
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          style={{ fontSize: '10px' }}
                          onClick={() => setActiveTooltip(null)}
                        />
                      </div>
                      <div className="mb-2">
                        <label className="xsmall text-muted mb-1 d-block">Tooth Number</label>
                        <select
                          className="form-select form-select-sm bg-dark text-white border-secondary"
                          value={activeTooltip.toothNumber}
                          onChange={(e) => setActiveTooltip({ ...activeTooltip, toothNumber: parseInt(e.target.value) })}
                        >
                          {FDI_TEETH.map(t => (
                            <option key={t} value={t}>Tooth #{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-2">
                        <label className="xsmall text-muted mb-1 d-block">Plaque Level</label>
                        <select
                          className="form-select form-select-sm bg-dark text-white border-secondary"
                          value={activeTooltip.plaqueLevel}
                          onChange={(e) => setActiveTooltip({ ...activeTooltip, plaqueLevel: e.target.value })}
                        >
                          <option value="High">High Severity</option>
                          <option value="Medium">Medium Severity</option>
                          <option value="Low">Low Severity</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="xsmall text-muted mb-1 d-block">Anatomical Region</label>
                        <select
                          className="form-select form-select-sm bg-dark text-white border-secondary"
                          value={activeTooltip.gumlineRegion || 'Gumline (Cervical)'}
                          onChange={(e) => setActiveTooltip({ ...activeTooltip, gumlineRegion: e.target.value })}
                        >
                          <option value="Gumline (Cervical)">Gumline (Cervical)</option>
                          <option value="Interproximal">Interproximal</option>
                          <option value="Crown Surface">Crown Surface</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-success w-100 font-weight-bold"
                        onClick={handleSaveTooltipNode}
                      >
                        Confirm Coordinate ✓
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Plaque Metrics & Tooth Mappings */}
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 p-4 mb-4 bg-white text-center" style={{ borderRadius: '16px' }}>
              <div className="text-muted small mb-1">Total Stained Plaque Area</div>
              <div className="display-4 font-weight-bold text-danger mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {coveragePercentage}%
              </div>
              <div className="small text-muted">
                Status: <strong className="text-dark">{aggregatedMappings.length > 0 ? `${aggregatedMappings.length} Teeth Affected (${mappings.length} Spots)` : 'Pending Scan'}</strong>
              </div>
            </div>

            {/* Mappings Table */}
            <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: '16px' }}>
              <h6 className="font-weight-bold text-dark mb-3">Detected Tooth Regions</h6>
              {aggregatedMappings.length === 0 ? (
                <div className="text-center py-4 bg-light rounded text-muted small">
                  No plaque regions detected yet. Upload a photo to analyze.
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <table className="table table-sm table-hover align-middle mb-0 text-start" style={{ fontSize: '13px' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Tooth</th>
                        <th>Severity</th>
                        <th>Region(s)</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedMappings.map((m, idx) => (
                        <tr key={idx}>
                          <td className="font-weight-bold text-primary">#{m.toothNumber}</td>
                          <td>
                            <span className={`badge ${m.plaqueLevel === 'High' ? 'bg-danger-subtle text-danger' : m.plaqueLevel === 'Medium' ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}`}>
                              {m.plaqueLevel}
                            </span>
                          </td>
                          <td className="small text-muted">{m.regionsStr || 'Cervical'}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-danger p-0"
                              title="Remove markers for this tooth"
                              onClick={() => {
                                const indicesSet = new Set(m.indices);
                                setMappings(mappings.filter((_, i) => !indicesSet.has(i)));
                              }}
                            >
                              <FaTrash size={11} />
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

      {/* TAB 3: Treatment Notes & Billable Procedures */}
      {activeTab === 'treatment' && (
        <div className="row g-4 animate-fade-in text-start">
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 p-4 bg-white mb-4" style={{ borderRadius: '16px' }}>
              <h5 className="font-weight-bold text-dark mb-3 d-flex align-items-center gap-2">
                <FaNotesMedical className="text-primary" /> Clinical Assessment & Notes
              </h5>
              <div className="mb-3">
                <label className="form-label small font-weight-bold">Dentist Clinical Observations</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Record patient oral conditions, plaque distribution, bleeding points, or restorations..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </div>
              <div className="mb-0">
                <label className="form-label small font-weight-bold">Recommendations & Home Care Plan</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="e.g. Brush twice daily with soft bristles, interdental flossing, chlorhexidine mouthwash for 7 days..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                />
              </div>
            </div>

            {/* Checkoff Billable Procedures */}
            <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: '16px' }}>
              <h5 className="font-weight-bold text-dark mb-3">Performed Procedures for Reception Billing</h5>
              <div className="row g-2">
                {STANDARD_PROCEDURES.map((proc) => {
                  const isChecked = selectedProcedures.includes(proc.id);
                  return (
                    <div className="col-md-6" key={proc.id}>
                      <div
                        className={`p-3 rounded border cursor-pointer d-flex justify-content-between align-items-center ${isChecked ? 'bg-primary-subtle border-primary' : 'bg-light'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleToggleProcedure(proc.id)}
                      >
                        <div>
                          <div className="font-weight-bold small text-dark">{proc.name}</div>
                          <div className="text-muted xsmall">₱{proc.defaultPrice.toFixed(2)}</div>
                        </div>
                        <input
                          type="checkbox"
                          className="form-check-input ms-2"
                          checked={isChecked}
                          onChange={() => handleToggleProcedure(proc.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Pricing Adjustments */}
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: '16px' }}>
              <h5 className="font-weight-bold text-dark mb-3">Severity Surcharges & Tools</h5>
              
              <div className="mb-3">
                <label className="form-label small font-weight-bold">Calculus & Plaque Case Severity</label>
                <select
                  className="form-select form-select-sm"
                  value={severityAdjustment}
                  onChange={(e) => setSeverityAdjustment(e.target.value)}
                >
                  <option value="none">Standard Case (No extra charge)</option>
                  <option value="moderate">Moderate Case (+₱1,000 deep scaling)</option>
                  <option value="severe">Severe Case (+₱2,000 ultrasonic & subgingival)</option>
                  <option value="custom">Custom recommended rate...</option>
                </select>
              </div>

              {severityAdjustment === 'custom' && (
                <div className="mb-3">
                  <label className="form-label small font-weight-bold">Custom Extra Amount (₱)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="e.g. 1500"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="form-label small font-weight-bold">Special Instruments / Medication Used</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Piezo scaler, subgingival curettes, topical gel"
                  value={specialTools}
                  onChange={(e) => setSpecialTools(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary w-100 py-2.5 font-weight-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                onClick={() => setShowCompleteModal(true)}
              >
                <FaCheckCircle /> Finalize Consultation ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Clinical Consultation"
        subtitle="Finalize tooth conditions, plaque validation, and billing recommendations"
        icon={FaCheckCircle}
        size="md"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-outline-secondary px-3"
              onClick={() => setShowCompleteModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={completing}
              className="btn btn-primary px-4 font-weight-bold"
              onClick={handleCompleteConsultation}
            >
              {completing ? 'Finalizing Records...' : 'Confirm & Mark Completed ✓'}
            </button>
          </div>
        }
      >
        <div className="bg-light p-3 rounded border text-start" style={{ fontSize: '13.5px' }}>
          <div className="mb-2"><strong>Patient:</strong> {patient?.firstName} {patient?.lastName}</div>
          <div className="mb-2"><strong>Plaque Coverage:</strong> {coveragePercentage}%</div>
          <div className="mb-2">
            <strong>Billable Procedures:</strong> {selectedProcedures.map(id => STANDARD_PROCEDURES.find(p => p.id === id)?.name).join(', ') || 'Consultation'}
          </div>
          <div className="mb-0">
            <strong>Severity Adjustment:</strong> {severityAdjustment.toUpperCase()}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConsultationWorkspace;
