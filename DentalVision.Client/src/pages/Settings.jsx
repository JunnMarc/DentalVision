import React, { useState, useEffect } from 'react';
import { FaSave, FaCog, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';

export const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (id, value) => {
    try {
      await api.put(`/admin/settings/${id}`, JSON.stringify(value), {
        headers: { 'Content-Type': 'application/json' }
      });
      setSuccessMessage("Clinic setting updated successfully.");
      setTimeout(() => setSuccessMessage(''), 3500);
      fetchSettings();
    } catch (err) {
      console.error("Error updating setting:", err);
    }
  };

  return (
    <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1000px' }}>
      {/* Page Header */}
      <PageHeader
        title="Clinic Configuration & Parameters"
        subtitle="Manage operating parameters, clinic branding, notification preferences, and default options."
        icon={FaCog}
      />

      {successMessage && (
        <div className="alert alert-success shadow-sm border-0 d-flex align-items-center gap-2 mb-4" style={{ borderRadius: '12px' }}>
          <FaCheckCircle /> <span className="small font-weight-bold">{successMessage}</span>
        </div>
      )}

      {/* Settings Card */}
      <div className="card shadow-sm border-0 p-4 bg-white text-start" style={{ borderRadius: '16px' }}>
        <h5 className="font-weight-bold text-dark mb-4 border-bottom pb-3">Operational Parameters</h5>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mx-auto mb-2" role="status" />
            <div className="small text-muted">Loading settings...</div>
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-4 text-muted small">No customizable parameters available.</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {settings.map(s => (
              <div key={s.id} className="row align-items-center p-3 rounded bg-light border">
                <div className="col-md-5">
                  <span className="font-weight-bold small text-dark d-block">{s.settingKey}</span>
                  <span className="text-muted xsmall">{s.description || 'System setting configuration.'}</span>
                </div>
                <div className="col-md-5 my-2 my-md-0">
                  <input 
                    type="text" 
                    className="form-control" 
                    defaultValue={s.settingValue}
                    id={`setting-input-${s.id}`}
                  />
                </div>
                <div className="col-md-2 text-end">
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(`setting-input-${s.id}`);
                      handleUpdate(s.id, input.value);
                    }}
                    className="btn btn-sm btn-primary w-100 font-weight-bold d-inline-flex align-items-center justify-content-center gap-1.5"
                  >
                    <FaSave size={12} /> Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
