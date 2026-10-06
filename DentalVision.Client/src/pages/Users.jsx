import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaUserPlus, FaUserShield, FaToggleOn, FaToggleOff, FaUsers } from 'react-icons/fa';
import api from '../services/api';
import useUsers from '../hooks/useUsers';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';

export const Users = () => {
  const { users, loading, refetch: fetchUsers } = useUsers();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  
  const { register, handleSubmit, reset, watch } = useForm();
  const watchedRole = watch("role", "3"); // default to Dental Staff (3)

  const onToggleActive = async (id) => {
    try {
      await api.put(`/users/${id}/toggle`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user status.");
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
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to register staff account.");
    }
  };

  return (
    <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1440px' }}>
      {/* Page Header */}
      <PageHeader
        title="Clinic Staff & Clinician Management"
        subtitle="Manage clinician profiles, dental staff credentials, and system access roles."
        icon={FaUsers}
        actions={
          <button 
            className="btn btn-primary d-flex align-items-center gap-2 font-weight-bold shadow-sm"
            onClick={() => setShowModal(true)}
          >
            <FaUserPlus /> Register Staff Member
          </button>
        }
      />

      {/* Staff Table */}
      <div className="card shadow-sm border-0 overflow-hidden bg-white" style={{ borderRadius: '16px' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mx-auto mb-2" role="status" />
            <div className="small text-muted">Loading staff accounts...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-muted small">
            No staff records found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13.5px' }}>
              <thead className="table-light" style={{ backgroundColor: '#F8FAFC' }}>
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3">Email Address</th>
                  <th className="py-3">Role</th>
                  <th className="py-3">Date Joined</th>
                  <th className="py-3">Account Status</th>
                  <th className="py-3 text-end px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-bottom">
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center gap-2.5">
                        <div
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary"
                          style={{ width: 34, height: 34 }}
                        >
                          <FaUserShield size={14} />
                        </div>
                        <span className="font-weight-bold text-dark">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted">{u.email}</td>
                    <td className="py-3">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 font-weight-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`badge ${u.isActive ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-2.5 py-1 font-weight-bold`}>
                        ● {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 text-end px-4">
                      <button 
                        onClick={() => onToggleActive(u.id)}
                        className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'} d-inline-flex align-items-center gap-1.5 px-2.5 py-1 font-weight-bold`}
                        style={{ fontSize: '12px' }}
                      >
                        {u.isActive ? <FaToggleOff /> : <FaToggleOn />} {u.isActive ? 'Deactivate' : 'Activate'}
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
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register Staff Account"
        subtitle="Create a new login account with role permissions"
        icon={FaUserPlus}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

          <div className="row g-3 text-start">
            <div className="col-6">
              <label className="form-label small font-weight-bold">First Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control" {...register("firstName", { required: true })} />
            </div>
            <div className="col-6">
              <label className="form-label small font-weight-bold">Last Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control" {...register("lastName", { required: true })} />
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">Email Address <span className="text-danger">*</span></label>
              <input type="email" className="form-control" placeholder="e.g. name@dentalvision.com" {...register("email", { required: true })} />
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">Password <span className="text-danger">*</span></label>
              <input type="password" className="form-control" placeholder="••••••••" {...register("password", { required: true })} />
            </div>
            <div className="col-12">
              <label className="form-label small font-weight-bold">System Role <span className="text-danger">*</span></label>
              <select className="form-select" {...register("role", { required: true })}>
                <option value="1">Administrator</option>
                <option value="2">Dentist</option>
                <option value="3">Dental Staff / Receptionist</option>
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

            <div className="col-12 text-end mt-4">
              <button type="button" className="btn btn-outline-secondary me-2 px-3" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4 font-weight-bold">
                Save Account ✓
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
