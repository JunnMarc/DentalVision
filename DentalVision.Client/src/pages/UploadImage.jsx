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
      setUploading(false);
    }
  };

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

          {/* Preprocessing Options Sliders */}
          {previewUrl && (
            <div className="border rounded p-3 mb-4 bg-light shadow-sm">
              <h6 className="font-weight-bold text-teal mb-3" style={{ color: '#0D9488' }}>Image Preprocessing Settings</h6>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small font-weight-bold text-secondary">Brightness Adjustment</span>
                  <span className="small badge text-dark bg-light border">{brightness > 0 ? `+${brightness}` : brightness}</span>
                </div>
                <input 
                  type="range" 
                  className="form-range" 
                  min="-100" 
                  max="100" 
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small font-weight-bold text-secondary">Contrast Factor (α)</span>
                  <span className="small badge text-dark bg-light border">{contrast.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  className="form-range" 
                  min="1.0" 
                  max="3.0" 
                  step="0.1"
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                />
              </div>

              <div className="mb-1">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small font-weight-bold text-secondary">Noise Reduction Filter (Median)</span>
                  <span className="small badge text-dark bg-light border">{denoise}px</span>
                </div>
                <input 
                  type="range" 
                  className="form-range" 
                  min="1" 
                  max="9" 
                  step="2"
                  value={denoise}
                  onChange={(e) => setDenoise(parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

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
