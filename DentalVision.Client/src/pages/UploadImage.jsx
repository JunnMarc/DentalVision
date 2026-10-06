import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCloudUploadAlt, FaCamera, FaCheckCircle, FaExclamationCircle, FaMicroscope } from 'react-icons/fa';
import api from '../services/api';
import usePatients from '../hooks/usePatients';
import PageHeader from '../components/common/PageHeader';
import PatientSearchInput from '../components/common/PatientSearchInput';

export const UploadImage = () => {
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const navigate = useNavigate();

  const { patients } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientIdParam && patients.length > 0) {
      const match = patients.find(p => String(p.id) === String(patientIdParam));
      if (match) setSelectedPatient(match);
    }
  }, [patientIdParam, patients]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError("Please choose a patient for this dental scan.");
      return;
    }
    if (!file) {
      setError("Please select a dental scan photo.");
      return;
    }

    setError('');
    setUploading(true);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep(prev => Math.min(3, prev + 1));
    }, 1200);

    try {
      const formData = new FormData();
      formData.append('PatientId', selectedPatient.id);
      formData.append('File', file);
      if (notes) formData.append('Notes', notes);

      const response = await api.post('/plaque/upload-and-analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(interval);
      navigate('/plaque-validation', {
        state: {
          analysisId: response.data.analysisId,
          patientId: selectedPatient.id,
          patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`
        }
      });
    } catch (err) {
      clearInterval(interval);
      console.error("AI analysis failure:", err);
      setError(err.response?.data?.message || "Failed to process dental scan with AI model.");
      setUploading(false);
    }
  };

  if (uploading) {
    return (
      <div className="container-fluid p-5 d-flex align-items-center justify-content-center min-vh-75 animate-fade-in">
        <div className="card shadow-sm border-0 p-5 text-center bg-white" style={{ borderRadius: '20px', maxWidth: '520px' }}>
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center text-primary bg-primary-subtle mb-3"
            style={{ width: '72px', height: '72px' }}
          >
            <FaMicroscope size={36} />
          </div>
          <h4 className="font-weight-bold text-dark mb-1">AI Plaque Segmentation Engine</h4>
          <p className="text-muted small mb-4">
            Processing disclosed clinical photo via DeepLabv3+ neural network pipeline...
          </p>

          {/* Stepper Progress */}
          <div className="d-flex flex-column gap-2.5 text-start bg-light p-3.5 rounded border small">
            <div className={`d-flex align-items-center gap-2 ${loadingStep >= 1 ? 'text-success font-weight-bold' : 'text-primary font-weight-bold'}`}>
              {loadingStep >= 1 ? <FaCheckCircle /> : <span className="spinner-border spinner-border-sm" />}
              <span>1. Normalizing tooth brightness & color channels</span>
            </div>
            <div className={`d-flex align-items-center gap-2 ${loadingStep >= 2 ? 'text-success font-weight-bold' : loadingStep === 1 ? 'text-primary font-weight-bold' : 'text-muted opacity-50'}`}>
              {loadingStep >= 2 ? <FaCheckCircle /> : loadingStep === 1 ? <span className="spinner-border spinner-border-sm" /> : <span>•</span>}
              <span>2. Segmenting biofilm & disclosed plaque boundaries</span>
            </div>
            <div className={`d-flex align-items-center gap-2 ${loadingStep >= 3 ? 'text-success font-weight-bold' : loadingStep === 2 ? 'text-primary font-weight-bold' : 'text-muted opacity-50'}`}>
              {loadingStep >= 3 ? <FaCheckCircle /> : loadingStep === 2 ? <span className="spinner-border spinner-border-sm" /> : <span>•</span>}
              <span>3. Calculating tooth surface coverage % & severity metrics</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '900px' }}>
      {/* Page Header */}
      <PageHeader
        title="Upload Dental Photo & Run AI Plaque Scan"
        subtitle="Submit disclosing dye photos to generate automated surface area plaque mappings."
        icon={FaCamera}
      />

      <div className="card shadow-sm border-0 p-4 p-md-5 bg-white text-start" style={{ borderRadius: '16px' }}>
        {error && (
          <div className="alert alert-danger py-2 small mb-4 d-flex align-items-center gap-2">
            <FaExclamationCircle /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpload}>
          {/* Patient Selector */}
          <div className="mb-4">
            <label className="form-label small font-weight-bold">Target Patient Record <span className="text-danger">*</span></label>
            <PatientSearchInput
              patients={patients}
              selectedPatient={selectedPatient}
              onSelectPatient={(p) => setSelectedPatient(p)}
              onClear={() => setSelectedPatient(null)}
            />
          </div>

          {/* Photo Dropzone */}
          <div className="mb-4">
            <label className="form-label small font-weight-bold">Clinical Photo (Disclosed Teeth) <span className="text-danger">*</span></label>
            <div 
              className="border rounded p-4 text-center bg-light d-flex flex-column align-items-center justify-content-center"
              style={{ borderStyle: 'dashed', cursor: 'pointer', minHeight: '220px', borderColor: '#CBD5E1' }}
              onClick={() => document.getElementById('dentalImageFileInput').click()}
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Dental Scan Preview" 
                  className="img-fluid rounded shadow-sm" 
                  style={{ maxHeight: '200px', objectFit: 'contain' }}
                />
              ) : (
                <>
                  <FaCloudUploadAlt size={48} className="text-primary mb-2" />
                  <div className="font-weight-bold small text-dark">Click or drag dental photo here to upload</div>
                  <div className="text-muted xsmall mt-1">Supports PNG, JPG, or JPEG formats. High resolution recommended.</div>
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

          <div className="mb-4">
            <label className="form-label small font-weight-bold">Clinician Notes / Observations</label>
            <textarea 
              className="form-control" 
              rows="3" 
              placeholder="e.g. Upper anterior teeth, 2-tone disclosing solution applied, patient reports sensitivity..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2.5 font-weight-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
          >
            <FaMicroscope /> Run AI Plaque Detection & Open Validation Canvas →
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadImage;
