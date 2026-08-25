import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FaCloudUploadAlt, FaUser } from 'react-icons/fa';

const UploadImage = () => {
  const [patients, setPatients] = useState([]);
  const [searchParams] = useSearchParams();
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1.0);
  const [denoise, setDenoise] = useState(3);
  const [uploading, setUploading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // Ticker steps for clinical feedback
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients');
        setPatients(response.data);
      } catch (error) {
        console.error("Error loading patients list:", error);
      }
    };
    fetchPatients();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError("Please choose a patient.");
      return;
    }
    if (!file) {
      setError("Please select a dental image file.");
      return;
    }

    setError('');
    setUploading(true);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep(prev => Math.min(3, prev + 1));
    }, 1500);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", parseInt(selectedPatientId));
    formData.append("notes", notes);
    formData.append("brightness", brightness);
    formData.append("contrast", contrast);
    formData.append("denoise", denoise);

    try {
      const response = await api.post('/plaque/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const analysisId = response.data.analysis.id;
      // Auto redirect to validation interface
      navigate(`/plaque/validate/${analysisId}`);
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error.response?.data?.message || "An error occurred during file upload.");
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  };

  if (uploading) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto' }}>
        <div className="clinic-card text-center p-5 bg-white shadow-lg" style={{ borderRadius: '16px', borderTop: '5px solid #0EA5E9' }}>
          <div className="mb-4">
            <div className="spinner-border text-primary" style={{ width: '4rem', height: '4rem', borderWidth: '0.4rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
          
          <h4 className="font-weight-bold mb-3" style={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
            Scanning....
          </h4>
          
          <p className="text-secondary small mb-4">
            Our neural networks are processing your dental photo to isolate plaque boundaries and map tooth locations.
          </p>

          <div className="p-3 bg-light rounded text-start border" style={{ minHeight: '140px' }}>
            <h6 className="xsmall text-muted font-weight-bold mb-3 uppercase" style={{ letterSpacing: '0.5px', fontSize: '9px' }}>
              Execution Log
            </h6>
            
            <div className="d-flex flex-column gap-2" style={{ fontSize: '13px' }}>
              <div className="d-flex align-items-center gap-2">
                <span className="text-success font-weight-bold">✓</span>
                <span className="text-secondary">Image upload completed successfully.</span>
              </div>

              {loadingStep >= 1 ? (
                <div className="d-flex align-items-center gap-2">
                  <span className={loadingStep === 1 ? "spinner-border spinner-border-sm text-primary" : "text-success font-weight-bold"}>
                    {loadingStep > 1 && "✓"}
                  </span>
                  <span className={loadingStep === 1 ? "font-weight-bold text-dark" : "text-secondary"}>
                    Querying Roboflow Cloud Inference Engine...
                  </span>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2 text-muted" style={{ color: '#94a3b8' }}>
                  <span style={{ width: '12px' }}>•</span>
                  <span>Querying Roboflow Cloud Inference Engine...</span>
                </div>
              )}

              {loadingStep >= 2 ? (
                <div className="d-flex align-items-center gap-2">
                  <span className={loadingStep === 2 ? "spinner-border spinner-border-sm text-primary" : "text-success font-weight-bold"}>
                    {loadingStep > 2 && "✓"}
                  </span>
                  <span className={loadingStep === 2 ? "font-weight-bold text-dark" : "text-secondary"}>
                    Applying Solidity boundary shape-smoothing...
                  </span>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2 text-muted" style={{ color: '#94a3b8' }}>
                  <span style={{ width: '12px' }}>•</span>
                  <span>Applying Solidity boundary shape-smoothing...</span>
                </div>
              )}

              {loadingStep >= 3 ? (
                <div className="d-flex align-items-center gap-2">
                  <span className="spinner-border spinner-border-sm text-primary"></span>
                  <span className="font-weight-bold text-dark">
                    Mapping anatomical regions (Cervical/Incisal)...
                  </span>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2 text-muted" style={{ color: '#94a3b8' }}>
                  <span style={{ width: '12px' }}>•</span>
                  <span>Mapping anatomical regions (Cervical/Incisal)...</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-muted xsmall">
            Please do not refresh the browser or click away.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h3 className="mb-4 font-weight-bold">Upload Dental Plaque Image</h3>

      <div className="clinic-card">
        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div className="mb-3">
            <label className="form-label small font-weight-bold">Patient</label>
            <select 
              className="form-select" 
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
              disabled={!!searchParams.get('patientId')}
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Area */}
          <div className="mb-4">
            <label className="form-label small font-weight-bold">Select Dental Photo (Plaque Disclosed)</label>
            <div 
              className="border rounded p-4 text-center bg-light d-flex flex-column align-items-center justify-content-center"
              style={{ borderStyle: 'dashed', cursor: 'pointer', minHeight: '220px' }}
              onClick={() => document.getElementById('dentalImageFileInput').click()}
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Dental Preview" 
                  className="img-fluid rounded" 
                  style={{ maxHeight: '180px', objectFit: 'contain' }}
                />
              ) : (
                <>
                  <FaCloudUploadAlt size={48} className="text-primary mb-2" style={{ color: '#2563EB' }} />
                  <div className="font-weight-bold small">Click or drag files here to upload</div>
                  <div className="text-muted xsmall mt-1">Supports PNG, JPG, or JPEG formats. Max 10MB.</div>
                </>
              )}
            </div>
            <input 
              id="dentalImageFileInput"
              type="file" 
              className="d-none" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Preprocessing Options Sliders hidden to match document screenshots */}

          <div className="mb-4">
            <label className="form-label small font-weight-bold">Upload Notes / Remarks</label>
            <textarea 
              className="form-control" 
              rows="3" 
              placeholder="e.g. Upper arches, disclosing solution applied, post-brushing checkup..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary-clinic w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                Analyzing plaque coverage...
              </>
            ) : 'Analyze Dental Image'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadImage;
