import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { FaUser, FaInfoCircle, FaCalendarAlt, FaFileInvoiceDollar, FaExclamationTriangle, FaEdit, FaSave } from 'react-icons/fa';

const MyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    dateOfBirth: '',
    gender: 'Male',
    phone: '',
    address: '',
    medicalHistory: ''
  });

  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Appointment Booking form states
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookingFormData, setBookingFormData] = useState({
    dentistId: '2',
    apptDate: '',
    apptTime: '',
    apptReason: ''
  });

  const handleBookingInputChange = (e) => {
    const { name, value } = e.target;
    setBookingFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!profile) {
      alert("Please complete your patient profile details first!");
      return;
    }
    try {
      const payload = {
        patientId: profile.id,
        dentistId: parseInt(bookingFormData.dentistId),
        appointmentDate: `${bookingFormData.apptDate}T${bookingFormData.apptTime}:00`,
        reason: bookingFormData.apptReason || 'Routine checkup',
        notes: 'Booked via Patient Portal',
        status: 4 // Requested (AppointmentStatus.Requested)
      };

      await api.post('/appointments', payload);
      alert("Appointment request submitted successfully! It is now pending dental staff confirmation.");
      setShowBookModal(false);
      // Reset form
      setBookingFormData({
        dentistId: '2',
        apptDate: '',
        apptTime: '',
        apptReason: ''
      });
      fetchProfile(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to submit appointment request. Please verify inputs.");
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients/my-profile');
      setProfile(res.data);
      setFormData({
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        dateOfBirth: res.data.dateOfBirth ? res.data.dateOfBirth.split('T')[0] : '',
        gender: res.data.gender || 'Male',
        phone: res.data.phone || '',
        address: res.data.address || '',
        medicalHistory: res.data.medicalHistory || ''
      });

      // Fetch appointments & invoices for this patient
      try {
        const apptsRes = await api.get('/appointments');
        // Filter appointments belonging to this patient
        const patientAppts = apptsRes.data.filter(a => a.patientId === res.data.id);
        setAppointments(patientAppts);

        const invsRes = await api.get('/billing');
        // Filter invoices belonging to this patient
        const patientInvoices = invsRes.data.filter(i => i.patientId === res.data.id);
        setInvoices(patientInvoices);
      } catch (err) {
        console.error("Failed to load supplemental profile data:", err);
      }

      setError('');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Patient record does not exist yet
        setProfile(null);
      } else {
        setError('Error loading profile data. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        email: user?.email, // set by backend but nice to pass
        medicalHistory: formData.medicalHistory
      };

      const res = await api.post('/patients/my-profile', payload);
      setProfile(res.data);
      setIsEditing(false);
      fetchProfile(); // refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile. Please check inputs.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-50 py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </div>
      </div>
    );
  }

  // If new user (no patient profile created yet) or they clicked edit
  if (!profile || isEditing) {
    return (
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            {!profile && (
              <div className="alert alert-info d-flex align-items-center mb-4 shadow-sm" style={{ borderLeft: '5px solid #0EA5E9' }}>
                <FaInfoCircle size={24} className="text-info me-3" />
                <div>
                  <h6 className="alert-heading mb-1 font-weight-bold">Complete Your Registration</h6>
                  Please fill out your personal information and allergies below to finish setting up your account. This information helps your dentist deliver safe, customized care.
                </div>
              </div>
            )}

            <div className="card shadow border-0 p-4" style={{ borderRadius: '16px' }}>
              <div className="border-bottom pb-3 mb-4 d-flex justify-content-between align-items-center">
                <h4 className="font-weight-bold mb-0 text-primary">
                  {profile ? 'Edit Personal Information' : 'Personal Information Setup'}
                </h4>
                {profile && (
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {error && <div className="alert alert-danger small py-2">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small font-weight-bold">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small font-weight-bold">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small font-weight-bold">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small font-weight-bold">Gender</label>
                    <select
                      className="form-select"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small font-weight-bold">Contact Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +63 917 123 4567"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small font-weight-bold">Email Address</label>
                    <input
                      type="email"
                      className="form-control bg-light"
                      value={user?.email || ''}
                      disabled
                    />
                    <div className="form-text xsmall">Email address is managed by your account.</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label small font-weight-bold">Home Address</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="e.g. 123 Main St, Manila City"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <div className="p-3 bg-light rounded" style={{ borderLeft: '4px solid #EF4444' }}>
                      <label className="form-label small font-weight-bold text-danger d-flex align-items-center">
                        <FaExclamationTriangle className="me-2" /> Medical History, Conditions, & Allergies
                      </label>
                      <textarea
                        className="form-control mt-1"
                        name="medicalHistory"
                        value={formData.medicalHistory}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="IMPORTANT: Please specify any known drug allergies (e.g. Penicillin, Latex) or medical conditions (e.g. Hypertension, Diabetes) here so your dentist is notified."
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top text-end">
                  <button type="submit" className="btn btn-primary px-4 d-inline-flex align-items-center">
                    <FaSave className="me-2" /> Save Profile Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile View mode
  return (
    <div className="container py-4">
      {/* Header Profile Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="font-weight-bold mb-0 text-primary" style={{ letterSpacing: '-0.5px' }}>My Patient Profile</h2>
          <p className="text-muted small mb-0">Welcome back, {profile.firstName}! View your registered info, appointments, and bills.</p>
        </div>
        <button 
          className="btn btn-outline-primary btn-sm d-flex align-items-center shadow-sm"
          onClick={() => setIsEditing(true)}
        >
          <FaEdit className="me-2" /> Edit Info
        </button>
      </div>

      <div className="row g-4">
        {/* Left Column: Personal info card & Allergies */}
        <div className="col-md-5">
          {/* Main Info Card */}
          <div className="card shadow-sm border-0 mb-4 overflow-hidden" style={{ borderRadius: '16px' }}>
            <div className="bg-primary p-4 text-white d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
              <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '64px', height: '64px' }}>
                <FaUser size={30} />
              </div>
              <div className="ms-3">
                <h5 className="mb-0 font-weight-bold text-white">{profile.firstName} {profile.lastName}</h5>
                <span className="badge bg-light text-dark font-weight-bold xsmall mt-1 px-2 py-1">
                  ID: {profile.patientCode}
                </span>
              </div>
            </div>
            
            <div className="card-body p-4 bg-white">
              <div className="row g-3">
                <div className="col-6">
                  <div className="text-muted xsmall font-weight-bold">DATE OF BIRTH</div>
                  <div className="small font-weight-bold" style={{ color: '#1E293B' }}>
                    {new Date(profile.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-muted xsmall font-weight-bold">GENDER</div>
                  <div className="small font-weight-bold" style={{ color: '#1E293B' }}>{profile.gender}</div>
                </div>
                <div className="col-12 border-top pt-2">
                  <div className="text-muted xsmall font-weight-bold">CONTACT NUMBER</div>
                  <div className="small font-weight-bold" style={{ color: '#1E293B' }}>{profile.phone}</div>
                </div>
                <div className="col-12 border-top pt-2">
                  <div className="text-muted xsmall font-weight-bold">EMAIL ADDRESS</div>
                  <div className="small font-weight-bold" style={{ color: '#1E293B' }}>{profile.email}</div>
                </div>
                <div className="col-12 border-top pt-2">
                  <div className="text-muted xsmall font-weight-bold">HOME ADDRESS</div>
                  <div className="small text-muted">{profile.address}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Allergies & Medical History Panel */}
          <div className="card shadow-sm border-0 overflow-hidden" style={{ borderRadius: '16px', borderLeft: '6px solid #EF4444' }}>
            <div className="card-header bg-white border-0 pt-3 pb-0 px-4">
              <h6 className="font-weight-bold text-danger d-flex align-items-center mb-0">
                <FaExclamationTriangle size={18} className="me-2" /> Allergies & Medical Warnings
              </h6>
            </div>
            <div className="card-body px-4 pb-4 pt-3">
              <div className="p-3 rounded" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', color: '#991B1B' }}>
                <p className="small mb-0 font-weight-bold" style={{ whiteSpace: 'pre-line' }}>
                  {profile.medicalHistory || "None declared. Please specify if you have any drug allergies or medical conditions."}
                </p>
              </div>
              <p className="text-muted xsmall mt-2 mb-0">
                * Note: This warning card is immediately highlighted in red inside the Dentist portal to ensure clinical safety during consultations.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Appointments & Billing */}
        <div className="col-md-7">
          {/* Appointments list */}
          <div className="card shadow-sm border-0 mb-4 p-4" style={{ borderRadius: '16px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="font-weight-bold text-dark mb-0 d-flex align-items-center">
                <FaCalendarAlt size={18} className="text-primary me-2" /> My Appointments
              </h5>
              <button 
                onClick={() => setShowBookModal(true)} 
                className="btn btn-sm btn-primary px-3 rounded-pill"
              >
                Book Appointment
              </button>
            </div>

            {/* Inline Booking Form Card */}
            {showBookModal && (
              <div className="card p-3 mb-3 border-primary-subtle bg-light shadow-sm text-start" style={{ borderLeft: '4px solid #2563EB' }}>
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h6 className="font-weight-bold m-0 text-primary">Schedule New Appointment</h6>
                  <button 
                    onClick={() => setShowBookModal(false)} 
                    className="btn-close" 
                    style={{ fontSize: '10px' }}
                  ></button>
                </div>
                <form onSubmit={handleBookAppointmentSubmit}>
                  <div className="row g-2">
                    <div className="col-12">
                      <label className="form-label xsmall font-weight-bold">Select Dentist</label>
                      <select 
                        name="dentistId" 
                        value={bookingFormData.dentistId} 
                        onChange={handleBookingInputChange} 
                        className="form-select form-select-sm"
                        required
                      >
                        <option value="2">Dr. John Smith (Orthodontics)</option>
                        <option value="3">Dr. Sarah Connor (Periodontics)</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label xsmall font-weight-bold">Preferred Date</label>
                      <input 
                        type="date" 
                        name="apptDate" 
                        value={bookingFormData.apptDate} 
                        onChange={handleBookingInputChange} 
                        className="form-control form-control-sm" 
                        required 
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label xsmall font-weight-bold">Preferred Time</label>
                      <input 
                        type="time" 
                        name="apptTime" 
                        value={bookingFormData.apptTime} 
                        onChange={handleBookingInputChange} 
                        className="form-control form-control-sm" 
                        required 
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label xsmall font-weight-bold">Reason for Visit</label>
                      <input 
                        type="text" 
                        name="apptReason" 
                        value={bookingFormData.apptReason} 
                        onChange={handleBookingInputChange} 
                        placeholder="e.g. Gum bleeding, Plaque check-up" 
                        className="form-control form-control-sm" 
                        required 
                      />
                    </div>
                    <div className="col-12 text-end mt-3">
                      <button 
                        type="button" 
                        onClick={() => setShowBookModal(false)} 
                        className="btn btn-sm btn-outline-secondary me-2 px-3"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-sm btn-primary px-3 text-white"
                      >
                        Request Booking
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {appointments.length === 0 ? (
              <div className="text-center py-4 bg-light rounded text-muted small">
                No appointment history found.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Date & Time</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td className="font-weight-bold">
                          {new Date(appt.appointmentDate).toLocaleDateString()} at{' '}
                          {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>{appt.reason || 'Routine Checkup'}</td>
                        <td>
                          <span className={`badge px-2 py-1 rounded ${
                            appt.status === 1 ? 'bg-success text-white' :
                            appt.status === 0 ? 'bg-primary text-white' :
                            appt.status === 4 ? 'bg-warning text-dark' : 'bg-danger text-white'
                          }`}>
                            {
                              appt.status === 0 ? 'Scheduled' :
                              appt.status === 1 ? 'Completed' :
                              appt.status === 2 ? 'Cancelled' :
                              appt.status === 3 ? 'No Show' :
                              appt.status === 4 ? 'Pending Confirmation' :
                              appt.status
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invoices list */}
          <div className="card shadow-sm border-0 p-4" style={{ borderRadius: '16px' }}>
            <h5 className="font-weight-bold text-dark mb-3 d-flex align-items-center">
              <FaFileInvoiceDollar size={18} className="text-primary me-2" /> My Billing Invoices
            </h5>
            {invoices.length === 0 ? (
              <div className="text-center py-4 bg-light rounded text-muted small">
                No billing invoice records found.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Invoice ID</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="font-weight-bold text-primary">INV-00{inv.id}</td>
                        <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                        <td className="font-weight-bold">₱{inv.grandTotal.toFixed(2)}</td>
                        <td className={`font-weight-bold ${inv.balanceDue > 0 ? 'text-danger' : 'text-success'}`}>
                          ₱{inv.balanceDue.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge px-2 py-1 rounded ${
                            inv.paymentStatus === 'Paid' ? 'bg-success' :
                            inv.paymentStatus === 'PartiallyPaid' ? 'bg-warning text-dark' : 'bg-danger'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
