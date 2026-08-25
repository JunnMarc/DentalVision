import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FaUserPlus, FaSearch, FaUser } from 'react-icons/fa';
import { useForm } from 'react-hook-form';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { hasRole } = useAuth();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchPatients = async (query = '') => {
    try {
      const response = await api.get(`/patients${query ? `?search=${query}` : ''}`);
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
      fetchPatients();
    } catch (error) {
      console.error("Error registering patient:", error);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="font-weight-bold m-0">Patient Records</h3>
        {hasRole(['Dental Staff', 'Administrator']) && (
          <button 
            className="btn btn-primary-clinic d-flex align-items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <FaUserPlus /> Register Patient
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="clinic-card mb-4 py-3">
        <div className="input-group">
          <span className="input-group-text bg-transparent border-end-0">
            <FaSearch className="text-muted" />
          </span>
          <input 
            type="text" 
            className="form-control border-start-0 ps-0" 
            placeholder="Search by first name, last name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          />
        </div>
      </div>

      {/* Patient Table */}
      <div className="clinic-card">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : patients.length === 0 ? (
          <p className="text-muted text-center py-4">No patient records found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-clinic align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, color: '#2563EB' }}>
                          <FaUser size={14} />
                        </div>
                        <span className="font-weight-bold">{p.firstName} {p.lastName}</span>
                      </div>
                    </td>
                    <td>{new Date(p.dateOfBirth).toLocaleDateString()}</td>
                    <td>{p.gender || 'N/A'}</td>
                    <td>{p.phone}</td>
                    <td>{p.email || 'N/A'}</td>
                    <td>
                      <Link to={`/patients/${p.id}`} className="btn btn-sm btn-teal-clinic">
                        View Profile
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
      {showModal && createPortal(
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white border-0 py-3" style={{ backgroundColor: '#2563EB' }}>
                <h5 className="modal-title font-weight-bold text-white">Register New Patient</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">First Name</label>
                      <input type="text" className="form-control" {...register("firstName", { required: true })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Last Name</label>
                      <input type="text" className="form-control" {...register("lastName", { required: true })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Date of Birth</label>
                      <input type="date" className="form-control" {...register("dateOfBirth", { required: true })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Gender</label>
                      <select className="form-select" {...register("gender")}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">Phone Number</label>
                      <input type="tel" className="form-control" {...register("phone", { required: true })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">Email Address</label>
                      <input type="email" className="form-control" {...register("email")} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">Address</label>
                      <input type="text" className="form-control" {...register("address")} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">Medical History / Allergies</label>
                      <textarea className="form-control" rows="2" placeholder="e.g. High blood pressure, penicillin allergy..." {...register("medicalHistory")}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-clinic">Save Record</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PatientList;
