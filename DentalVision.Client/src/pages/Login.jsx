import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { FaClinicMedical } from 'react-icons/fa';

const Login = () => {
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
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="card shadow-lg p-4 border-0" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: '60px', height: '60px', backgroundColor: '#2563EB' }}>
            <FaClinicMedical size={30} />
          </div>
          <h4 className="font-weight-bold" style={{ color: '#1E293B' }}>
            {isRegisterClinic ? 'Register Your Clinic' : isRegister ? 'Create Account' : 'DentalVision Login'}
          </h4>
          <p className="text-muted small">Plaque Mapping & Management System</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success py-2 small" role="alert">
            {successMessage}
          </div>
        )}

        {isRegisterClinic ? (
          <form onSubmit={handleRegisterClinicSubmit}>
            <div className="mb-3">
              <label className="form-label small font-weight-bold">Clinic Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Greenhills Dental Clinic"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required 
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small font-weight-bold">Clinic URL Slug</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. greenhills"
                value={clinicSlug}
                onChange={(e) => setClinicSlug(e.target.value)}
                required 
                style={{ borderRadius: '8px' }}
              />
              <div className="text-muted xsmall text-start mt-1">This will identify your clinic in the portal (alphanumeric only).</div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small font-weight-bold">Admin First Name</label>
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
              <div className="col-6">
                <label className="form-label small font-weight-bold">Admin Last Name</label>
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
            </div>

            <div className="mb-3">
              <label className="form-label small font-weight-bold">Admin Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="e.g. admin@yourclinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label small font-weight-bold">Admin Password</label>
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

            <div className="form-check mb-4 text-start">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="termsCheckboxClinic" 
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label className="form-check-label small text-muted" htmlFor="termsCheckboxClinic" style={{ cursor: 'pointer', userSelect: 'none' }}>
                I agree to the <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-primary font-weight-bold text-decoration-none">Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} className="text-primary font-weight-bold text-decoration-none">Privacy Policy</a>
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100 py-2 btn-primary-clinic" 
              disabled={loading}
            >
              {loading ? 'Registering Clinic...' : 'Register Clinic'}
            </button>
          </form>
        ) : isRegister ? (
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

            <div className="form-check mb-4 text-start">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="termsCheckbox" 
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label className="form-check-label small text-muted" htmlFor="termsCheckbox" style={{ cursor: 'pointer', userSelect: 'none' }}>
                I agree to the <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-primary font-weight-bold text-decoration-none">Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} className="text-primary font-weight-bold text-decoration-none">Privacy Policy</a>
              </label>
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

        <div className="text-center mt-3 d-flex flex-column gap-2 small">
          {isRegisterClinic ? (
            <span className="text-muted">
              Already registered?{' '}
              <button 
                onClick={() => { setIsRegisterClinic(false); setIsRegister(false); setError(''); setSuccessMessage(''); }} 
                className="btn btn-link p-0 text-decoration-none font-weight-bold"
                style={{ verticalAlign: 'baseline' }}
              >
                Sign In
              </button>
            </span>
          ) : isRegister ? (
            <span className="text-muted">
              Already have an account?{' '}
              <button 
                onClick={() => { setIsRegister(false); setError(''); setSuccessMessage(''); }} 
                className="btn btn-link p-0 text-decoration-none font-weight-bold"
                style={{ verticalAlign: 'baseline' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <>
              <span className="text-muted">
                New patient?{' '}
                <button 
                  onClick={() => { setIsRegister(true); setIsRegisterClinic(false); setError(''); setSuccessMessage(''); }} 
                  className="btn btn-link p-0 text-decoration-none font-weight-bold"
                  style={{ verticalAlign: 'baseline' }}
                >
                  Create Account
                </button>
              </span>
              <span className="text-muted mt-1">
                Are you a dentist?{' '}
                <button 
                  onClick={() => { setIsRegisterClinic(true); setIsRegister(false); setError(''); setSuccessMessage(''); }} 
                  className="btn btn-link p-0 text-decoration-none font-weight-bold"
                  style={{ verticalAlign: 'baseline' }}
                >
                  Register Your Clinic
                </button>
              </span>
            </>
          )}
        </div>

        {/* {!isRegister && (
          <div className="text-center mt-4 border-top pt-3">
            <p className="text-muted xsmall mb-1">Clinic demo logins:</p>
            <div className="xsmall text-start bg-light p-2 rounded" style={{ fontSize: 11 }}>
              <strong>Admin:</strong> admin@dentalvision.com / Admin123!<br />
              <strong>Dentist:</strong> dentist1@dentalvision.com / Dentist123!<br />
              <strong>Dental Staff:</strong> receptionist1@dentalvision.com / Recept123!
            </div>
          </div>
        )} */}
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="modal show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', maxHeight: '80vh' }}>
              <div className="modal-header bg-primary text-white py-3">
                <h6 className="modal-title font-weight-bold text-white mb-0">Terms of Service</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTermsModal(false)}></button>
              </div>
              <div className="modal-body p-4 text-start" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                <p className="font-weight-bold">Welcome to DentalVision!</p>
                <p>By registering a patient account, you agree to comply with and be bound by the following terms of service:</p>
                <ol className="ps-3">
                  <li className="mb-2"><strong>Patient Records:</strong> You consent to creating a digital clinical record profile and sharing relevant health history details with our licensed dentists.</li>
                  <li className="mb-2"><strong>Appointment Scheduling:</strong> All consultation slots are requests subject to availability and phone confirmation by clinic staff.</li>
                  <li className="mb-2"><strong>Data Safety:</strong> We implement administrative and technical security measures to protect dental imaging scans and clinical reports.</li>
                  <li className="mb-2"><strong>Code of Conduct:</strong> Users must provide genuine, accurate contact and medical history details. False profiles will be rejected and suspended.</li>
                </ol>
                <p className="text-muted small mt-3">Last updated: July 2026</p>
              </div>
              <div className="modal-footer bg-light border-0 py-2">
                <button type="button" className="btn btn-sm btn-primary px-4 btn-primary-clinic" onClick={() => setShowTermsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="modal show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', maxHeight: '80vh' }}>
              <div className="modal-header bg-primary text-white py-3">
                <h6 className="modal-title font-weight-bold text-white mb-0">Privacy Policy</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPrivacyModal(false)}></button>
              </div>
              <div className="modal-body p-4 text-start" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                <p className="font-weight-bold">Your Privacy is Our Priority</p>
                <p>This privacy policy explains how we collect, use, and safeguard your medical and personal details:</p>
                <ul className="ps-3">
                  <li className="mb-2"><strong>Information We Collect:</strong> Personal identifiers (name, email, phone number) and medical background reports.</li>
                  <li className="mb-2"><strong>HIPAA & Compliance:</strong> Clinical records are accessed only by authorized dentists and staff members to coordinate patient care.</li>
                  <li className="mb-2"><strong>Third-Party Sharing:</strong> We do not sell, rent, or distribute personal data to third parties.</li>
                  <li className="mb-2"><strong>Imaging Data:</strong> Dental upload images are securely stored and analyzed for clinical assessment reports.</li>
                </ul>
                <p className="text-muted small mt-3">Last updated: July 2026</p>
              </div>
              <div className="modal-footer bg-light border-0 py-2">
                <button type="button" className="btn btn-sm btn-primary px-4 btn-primary-clinic" onClick={() => setShowPrivacyModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
