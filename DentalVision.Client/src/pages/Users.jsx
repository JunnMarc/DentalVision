import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaUserPlus, FaUserShield, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useForm } from 'react-hook-form';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  
  const { register, handleSubmit, reset, watch } = useForm();
  const watchedRole = watch("role", "3"); // default to Dental Staff (3)

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Error loading users list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onToggleActive = async (id) => {
    try {
      await api.put(`/users/${id}/toggle`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update user status.");
    }
  };

  const onSubmit = async (data) => {
    try {
      setError('');
      const payload = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: parseInt(data.role),
        licenseNumber: data.licenseNumber || null,
        specialization: data.specialization || null,
        employeeCode: data.employeeCode || null
      };

      await api.post('/auth/register', payload);
      setShowModal(false);
      reset();
      fetchUsers();
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to register staff account.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="font-weight-bold m-0">Clinic Staff Management</h3>
        <button 
          className="btn btn-primary-clinic d-flex align-items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <FaUserPlus /> Register Staff
        </button>
      </div>

      <div className="clinic-card">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : users.length === 0 ? (
          <p className="text-muted text-center py-4">No staff records found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-clinic align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Date Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, color: '#14B8A6' }}>
                          <FaUserShield size={14} />
                        </div>
                        <span className="font-weight-bold">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className="font-weight-bold" style={{ 
                        color: u.role === 'Administrator' ? '#2563EB' :
                               u.role === 'Dentist' ? '#0891B2' :
                               u.role === 'Receptionist' ? '#475569' : '#64748B',
                        fontSize: '13px'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="font-weight-bold" style={{ 
                        color: u.isActive ? '#059669' : '#DC2626',
                        fontSize: '13px'
                      }}>
                        ● {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => onToggleActive(u.id)}
                        className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'} d-flex align-items-center gap-1`}
                        style={{ fontSize: 11 }}
                      >
                        {u.isActive ? <FaToggleOff /> : <FaToggleOn />} {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Staff Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white border-0 py-3" style={{ backgroundColor: '#2563EB' }}>
                <h5 className="modal-title font-weight-bold">Register Staff Account</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">First Name</label>
                      <input type="text" className="form-control" {...register("firstName", { required: true })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Last Name</label>
                      <input type="text" className="form-control" {...register("lastName", { required: true })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">Email Address</label>
                      <input type="email" className="form-control" placeholder="e.g. name@dental.com" {...register("email", { required: true })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">Password</label>
                      <input type="password" className="form-control" placeholder="••••••••" {...register("password", { required: true })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">System Role</label>
                      <select className="form-select" {...register("role", { required: true })}>
                        <option value="1">Administrator</option>
                        <option value="2">Dentist</option>
                        <option value="3">Dental Staff</option>
                      </select>
                    </div>

                    {/* Dentist specific fields */}
                    {watchedRole === "2" && (
                      <>
                        <div className="col-6">
                          <label className="form-label small font-weight-bold">License Number</label>
                          <input type="text" className="form-control" placeholder="e.g. DEN-LIC-XXXX" {...register("licenseNumber", { required: true })} />
                        </div>
                        <div className="col-6">
                          <label className="form-label small font-weight-bold">Specialization</label>
                          <input type="text" className="form-control" placeholder="e.g. Periodontics" {...register("specialization")} />
                        </div>
                      </>
                    )}

                    {/* Dental Staff specific fields */}
                    {watchedRole === "3" && (
                      <div className="col-12">
                        <label className="form-label small font-weight-bold">Employee Code</label>
                        <input type="text" className="form-control" placeholder="e.g. REC-EMP-XXXX" {...register("employeeCode", { required: true })} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-clinic">Save Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
