import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FaUserPlus, FaSearch, FaUser, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

export const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { hasRole } = useAuth();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const response = await api.get(`/patients${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      setPatients(response.data);
    } catch (error) {
      console.error("Error loading patients list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(search);
  }, [search]);

  const onSubmit = async (data) => {
    try {
      await api.post('/patients', data);
      setShowModal(false);
      reset();
      fetchPatients(search);
    } catch (error) {
      console.error("Error registering patient:", error);
    }
  };

  return (
    <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1440px' }}>
      {/* Header Bar */}
      <div className="card shadow-sm border-0 p-4 mb-4 bg-white" style={{ borderRadius: '16px' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h4 className="font-weight-bold text-dark mb-1 d-flex align-items-center gap-2">
              <FaUser className="text-primary" /> Patient Records & Health Directory
            </h4>
            <p className="text-muted small mb-0">
              Access comprehensive patient directories, medical histories, and clinical intake profiles.
            </p>
          </div>
          {hasRole(['Dental Staff', 'Administrator']) && (
            <button 
              className="btn btn-primary d-flex align-items-center gap-2 font-weight-bold shadow-sm"
              onClick={() => setShowModal(true)}
            >
              <FaUserPlus /> Register New Patient
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="row g-2 mt-3 pt-3 border-top">
          <div className="col-md-6 col-lg-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <FaSearch size={12} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder="Search by name, patient code, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="col-md-6 col-lg-7 text-md-end text-muted small d-flex align-items-center justify-content-md-end">
            <span>Showing <strong>{patients.length}</strong> patient record{patients.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="card shadow-sm border-0 overflow-hidden bg-white" style={{ borderRadius: '16px' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mx-auto mb-2" role="status" />
            <div className="small text-muted">Loading patient records...</div>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-5 text-muted small">
            No matching patient records found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13.5px' }}>
              <thead className="table-light" style={{ backgroundColor: '#F8FAFC' }}>
                <tr>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3">Profile Intake</th>
                  <th className="py-3">Date of Birth</th>
                  <th className="py-3">Gender</th>
                  <th className="py-3">Contact Phone</th>
                  <th className="py-3">Email Address</th>
                  <th className="py-3 text-end px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} className="border-bottom">
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center gap-2.5">
                        <div
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary"
                          style={{ width: 34, height: 34 }}
                        >
                          <FaUser size={13} />
                        </div>
                        <div>
                          <div className="font-weight-bold text-dark">{p.firstName} {p.lastName}</div>
                          <div className="xsmall text-muted">{p.patientCode || `PAT-00${p.id}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <StatusBadge type="profile" isProfileCompleted={p.isProfileCompleted} />
                    </td>
                    <td className="py-3">
                      {p.dateOfBirth ? (
                        new Date(p.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                      ) : (
                        <span className="text-muted fst-italic small">Pending Intake</span>
                      )}
                    </td>
                    <td className="py-3 small">{p.gender || 'N/A'}</td>
                    <td className="py-3 small">{p.phone}</td>
                    <td className="py-3 small text-muted">{p.email || 'N/A'}</td>
                    <td className="py-3 text-end px-4">
                      <Link to={`/patients/${p.id}`} className="btn btn-sm btn-outline-primary px-3 font-weight-bold">
                        View Chart
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register New Patient"
        subtitle="Create a new digital patient chart and clinical record"
        icon={FaUserPlus}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-3 text-start">
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">First Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control" {...register("firstName", { required: true })} />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Last Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control" {...register("lastName", { required: true })} />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Date of Birth <span className="text-danger">*</span></label>
              <input type="date" className="form-control" {...register("dateOfBirth", { required: true })} />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Gender <span className="text-danger">*</span></label>
              <select className="form-select" {...register("gender")}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Phone Number <span className="text-danger">*</span></label>
              <input type="tel" className="form-control" {...register("phone", { required: true })} />
            </div>
            <div className="col-md-6">
              <label className="form-label small font-weight-bold">Email Address</label>
              <input type="email" className="form-control" {...register("email")} />
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">Residential Address</label>
              <input type="text" className="form-control" {...register("address")} />
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">Medical History / Allergies</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="e.g. High blood pressure, penicillin allergy..."
                {...register("medicalHistory")}
              />
            </div>
            <div className="col-12 text-end mt-4">
              <button type="button" className="btn btn-outline-secondary me-2 px-3" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4 font-weight-bold">
                Save Record ✓
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientList;
