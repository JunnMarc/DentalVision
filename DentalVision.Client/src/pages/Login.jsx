import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { FaClinicMedical } from 'react-icons/fa';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const savedUser = JSON.parse(localStorage.getItem('user'));
      if (savedUser && (savedUser.role === 4 || savedUser.role === 'Patient')) {
        navigate('/my-profile');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        role: 4 // Patient
      });

      // Automatically sign in upon registration
      const loginRes = await login(email, password);
      setLoading(false);

      if (loginRes.success) {
        navigate('/my-profile');
      } else {
        setError("Registration succeeded, but login failed. Please sign in manually.");
        setIsRegister(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Email might already be taken.");
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="card shadow-lg p-4 border-0" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: '60px', height: '60px', backgroundColor: '#2563EB' }}>
            <FaClinicMedical size={30} />
          </div>
          <h4 className="font-weight-bold" style={{ color: '#1E293B' }}>
            {isRegister ? 'Create Patient Account' : 'DentalVision Login'}
          </h4>
          <p className="text-muted small">Plaque Mapping & Management System</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        )}

        {isRegister ? (
          <form onSubmit={handleRegisterSubmit}>
            <div className="mb-3">
              <label className="form-label small font-weight-bold">First Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required 
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small font-weight-bold">Last Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required 
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small font-weight-bold">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="e.g. john.smith@example.com"
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
                placeholder="Minimum 6 characters"
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
              {loading ? 'Registering...' : 'Register Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit}>
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
        )}

        <div className="text-center mt-3 small">
          {isRegister ? (
            <span className="text-muted">
              Already have an account?{' '}
              <button 
                onClick={() => { setIsRegister(false); setError(''); }} 
                className="btn btn-link p-0 text-decoration-none font-weight-bold"
                style={{ verticalAlign: 'baseline' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span className="text-muted">
              New patient?{' '}
              <button 
                onClick={() => { setIsRegister(true); setError(''); }} 
                className="btn btn-link p-0 text-decoration-none font-weight-bold"
                style={{ verticalAlign: 'baseline' }}
              >
                Create Account
              </button>
            </span>
          )}
        </div>

        {!isRegister && (
          <div className="text-center mt-4 border-top pt-3">
            <p className="text-muted xsmall mb-1">Clinic demo logins:</p>
            <div className="xsmall text-start bg-light p-2 rounded" style={{ fontSize: 11 }}>
              <strong>Admin:</strong> admin@dentalvision.com / Admin123!<br />
              <strong>Dentist:</strong> dentist1@dentalvision.com / Dentist123!<br />
              <strong>Dental Staff:</strong> receptionist1@dentalvision.com / Recept123!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
