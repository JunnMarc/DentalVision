import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaSave, FaCog } from 'react-icons/fa';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error) {
      console.error("Error loading settings:", error);
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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchSettings();
    } catch (error) {
      console.error("Error updating setting:", error);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3 className="mb-4 font-weight-bold">Clinic Configurations</h3>

      {success && (
        <div className="alert alert-success py-2 small" role="alert">
          Clinic settings saved successfully.
        </div>
      )}

      <div className="clinic-card">
        <h5 className="font-weight-bold mb-3 d-flex align-items-center gap-2">
          <FaCog /> Settings Parameters
        </h5>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : (
          <div className="d-flex flex-column gap-4 mt-3">
            {settings.map(s => (
              <div key={s.id} className="row align-items-center">
                <div className="col-4">
                  <span className="font-weight-bold small d-block">{s.settingKey}</span>
                  <span className="text-muted xsmall">{s.description || 'No description provided.'}</span>
                </div>
                <div className="col-6">
                  <input 
                    type="text" 
                    className="form-control" 
                    defaultValue={s.settingValue}
                    id={`setting-input-${s.id}`}
                  />
                </div>
                <div className="col-2">
                  <button 
                    onClick={() => {
                      const input = document.getElementById(`setting-input-${s.id}`);
                      handleUpdate(s.id, input.value);
                    }}
                    className="btn btn-primary-clinic btn-sm d-flex align-items-center gap-1 w-100 justify-content-center"
                  >
                    <FaSave /> Save
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
