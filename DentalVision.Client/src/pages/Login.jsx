import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaClinicMedical } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="card shadow-lg p-4 border-0" style={{ width: '400px', borderRadius: '16px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: '60px', height: '60px', backgroundColor: '#2563EB' }}>
            <FaClinicMedical size={30} />
          </div>
          <h4 className="font-weight-bold" style={{ color: '#1E293B' }}>DentalVision Login</h4>
          <p className="text-muted small">Plaque Mapping & Management System</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small font-weight-bold">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="e.g. dentist1@dentalvision.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="mb-4">
            <label className="form-label small font-weight-bold">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              style={{ borderRadius: '8px' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2 btn-primary-clinic" 
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4 border-top pt-3">
          <p className="text-muted xsmall mb-1">Clinic demo logins:</p>
          <div className="xsmall text-start bg-light p-2 rounded" style={{ fontSize: 11 }}>
            <strong>Admin:</strong> admin@dentalvision.com / Admin123!<br />
            <strong>Dentist:</strong> dentist1@dentalvision.com / Dentist123!<br />
            <strong>Receptionist:</strong> receptionist1@dentalvision.com / Recept123!
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
