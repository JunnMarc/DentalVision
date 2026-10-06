import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { FaClinicMedical, FaTooth } from 'react-icons/fa';
import DemoLoginCards from '../components/auth/DemoLoginCards';
import Modal from '../components/common/Modal';

export const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [isRegisterClinic, setIsRegisterClinic] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicSlug, setClinicSlug] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
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
    if (!acceptedTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to register.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        role: 4 // Patient
      });

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

  const handleRegisterClinicSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!acceptedTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to register.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register-clinic', {
        clinicName,
        clinicSlug: clinicSlug.trim().toLowerCase(),
        adminEmail: email,
        adminPassword: password,
        adminFirstName: firstName,
        adminLastName: lastName
      });

      localStorage.setItem('tenant_slug', clinicSlug.trim().toLowerCase());
      setSuccessMessage('Clinic registered successfully! You can now log in using your admin credentials.');
      setLoading(false);
      setIsRegisterClinic(false);
      setIsRegister(false);
      setFirstName('');
      setLastName('');
      setClinicName('');
      setClinicSlug('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Clinic registration failed. Slug might already be taken.');
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5 bg-light animate-fade-in">
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="row g-4 align-items-center justify-content-center">
          {/* Left / Main Card: Auth Form */}
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 p-4 p-md-5 bg-white text-start" style={{ borderRadius: '20px' }}>
              <div className="text-center mb-4">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center text-white mb-2 shadow-sm"
                  style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #2563EB 0%, #0D9488 100%)' }}
                >
                  <FaTooth size={26} />
                </div>
                <h4 className="font-weight-bold text-dark mb-1">
                  {isRegisterClinic ? 'Register New Dental Practice' : isRegister ? 'Patient Account Registration' : 'DentalVision Cloud Portal'}
                </h4>
                <p className="text-muted small">
                  {isRegisterClinic ? 'Set up a dedicated multi-tenant practice workspace.' : isRegister ? 'Create your digital patient chart & consultation profile.' : 'Sign in to access clinical charts, plaque scans, and schedules.'}
                </p>
              </div>

              {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}
              {successMessage && <div className="alert alert-success py-2 small mb-3">{successMessage}</div>}

              {/* Login Form */}
              {!isRegister && !isRegisterClinic && (
                <form onSubmit={handleLoginSubmit}>
                  <div className="mb-3">
                    <label className="form-label small font-weight-bold">Email Address</label>
                    <input
                      type="email"
                      className="form-control py-2"
                      placeholder="e.g. dentist1@dentalvision.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label small font-weight-bold">Password</label>
                    <input
                      type="password"
                      className="form-control py-2"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100 py-2.5 font-weight-bold shadow-sm"
                  >
                    {loading ? 'Authenticating...' : 'Sign In to Portal →'}
                  </button>
                  <div className="text-center mt-3 pt-3 border-top">
                    <div className="small text-muted mb-1">
                      New patient?{' '}
                      <button
                        type="button"
                        className="btn btn-link text-primary p-0 font-weight-bold text-decoration-none small"
                        onClick={() => { setIsRegister(true); setIsRegisterClinic(false); setError(''); }}
                      >
                        Register Patient Account
                      </button>
                    </div>
                    <div className="small text-muted">
                      Clinic owner?{' '}
                      <button
                        type="button"
                        className="btn btn-link text-secondary p-0 font-weight-bold text-decoration-none small"
                        onClick={() => { setIsRegisterClinic(true); setIsRegister(false); setError(''); }}
                      >
                        Register New Clinic Practice
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Patient Register Form */}
              {isRegister && (
                <form onSubmit={handleRegisterSubmit}>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">First Name</label>
                      <input type="text" className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Last Name</label>
                      <input type="text" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small font-weight-bold">Email Address</label>
                    <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small font-weight-bold">Password</label>
                    <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="termsCheck"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                    />
                    <label className="form-check-label xsmall text-muted" htmlFor="termsCheck">
                      I agree to the <button type="button" className="btn btn-link p-0 xsmall" onClick={() => setShowTermsModal(true)}>Terms of Service</button> and <button type="button" className="btn btn-link p-0 xsmall" onClick={() => setShowPrivacyModal(true)}>Privacy Policy</button>.
                    </label>
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-primary w-100 py-2.5 font-weight-bold">
                    {loading ? 'Creating Account...' : 'Complete Patient Registration →'}
                  </button>
                  <div className="text-center mt-3">
                    <button type="button" className="btn btn-link text-muted p-0 small" onClick={() => setIsRegister(false)}>
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* Clinic Register Form */}
              {isRegisterClinic && (
                <form onSubmit={handleRegisterClinicSubmit}>
                  <div className="mb-2">
                    <label className="form-label small font-weight-bold">Clinic Practice Name</label>
                    <input type="text" className="form-control" placeholder="e.g. Metro Dental Specialists" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small font-weight-bold">Subdomain Slug</label>
                    <input type="text" className="form-control" placeholder="e.g. metrodental" value={clinicSlug} onChange={(e) => setClinicSlug(e.target.value)} required />
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Admin First Name</label>
                      <input type="text" className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Admin Last Name</label>
                      <input type="text" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small font-weight-bold">Admin Email</label>
                    <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small font-weight-bold">Admin Password</label>
                    <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="clinicTermsCheck"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                    />
                    <label className="form-check-label xsmall text-muted" htmlFor="clinicTermsCheck">
                      I agree to the <button type="button" className="btn btn-link p-0 xsmall" onClick={() => setShowTermsModal(true)}>Terms of Service</button>.
                    </label>
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-primary w-100 py-2.5 font-weight-bold">
                    {loading ? 'Setting up Workspace...' : 'Register Clinic Practice →'}
                  </button>
                  <div className="text-center mt-3">
                    <button type="button" className="btn btn-link text-muted p-0 small" onClick={() => setIsRegisterClinic(false)}>
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: One-Click Demo Credentials */}
          <div className="col-lg-5">
            <DemoLoginCards
              onSelectCredentials={(selectedEmail, selectedPassword) => {
                setIsRegister(false);
                setIsRegisterClinic(false);
                setEmail(selectedEmail);
                setPassword(selectedPassword);
              }}
            />
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
        subtitle="DentalVision Cloud Clinical Platform"
        size="md"
      >
        <div className="small text-muted text-start" style={{ lineHeight: '1.6' }}>
          <p>By registering on DentalVision, you agree to:</p>
          <ul>
            <li>Accurate patient identity and contact disclosures.</li>
            <li>Consent to digital clinical charting and secure dental imaging storage.</li>
            <li>Confidentiality of clinical practitioner advice and notes.</li>
          </ul>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy & HIPAA Notice"
        subtitle="Data Privacy Standards"
        size="md"
      >
        <div className="small text-muted text-start" style={{ lineHeight: '1.6' }}>
          <p>Dental records are protected under healthcare privacy standards. Information is encrypted at rest and in transit.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Login;
