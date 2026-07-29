import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { FaUser, FaInfoCircle, FaCalendarAlt, FaFileInvoiceDollar, FaExclamationTriangle, FaEdit, FaSave, FaLock, FaClock, FaCheckCircle } from 'react-icons/fa';

const COMMON_ALLERGIES = [
  { id: 'penicillin', label: 'Penicillin / Amoxicillin', category: 'Drug' },
  { id: 'latex', label: 'Latex (Gloves / Dams)', category: 'Material' },
  { id: 'anesthetic', label: 'Local Anesthesia (Lidocaine)', category: 'Drug' },
  { id: 'sulfa', label: 'Sulfa Drugs', category: 'Drug' },
  { id: 'aspirin', label: 'Aspirin / Ibuprofen', category: 'Drug' }
];

const COMMON_CONDITIONS = [
  { id: 'hypertension', label: 'Hypertension (High BP)', category: 'Condition' },
  { id: 'diabetes', label: 'Diabetes', category: 'Condition' },
  { id: 'heart', label: 'Heart Conditions / Pacemaker', category: 'Condition' },
  { id: 'asthma', label: 'Asthma / Breathing issues', category: 'Condition' },
  { id: 'bleeding', label: 'Bleeding Disorders / Blood thinners', category: 'Condition' },
  { id: 'pregnant', label: 'Currently Pregnant', category: 'Condition' }
];

const MyProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleSignOutClick = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };
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

  const activeAppt = appointments
    .filter(a => a.status === 0 || a.status === 4)
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];

  const hasConfirmed = appointments.some(a => a.status === 0 || a.status === 1);

  // Medical History state hooks
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [customMedicalNotes, setCustomMedicalNotes] = useState('');

  // Appointment Booking form states
  const [showBookModal, setShowBookModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [bookingFormData, setBookingFormData] = useState({
    dentistId: '2',
    apptDate: '',
    apptTime: '',
    apptReason: '',
    phone: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleBookingInputChange = (e) => {
    const { name, value } = e.target;
    setBookingFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookAppointmentSubmit = (e) => {
    e.preventDefault();
    if (!profile) {
      showToast("Please wait until your patient profile is fully loaded!", "warning");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    setShowConfirmModal(false);
    try {
      // Automatically save/update the patient's phone contact detail
      const finalPhone = bookingFormData.phone || profile.phone;
      await api.post('/patients/my-profile', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender || 'Male',
        phone: finalPhone,
        email: profile.email,
        address: profile.address || '',
        medicalHistory: profile.medicalHistory || ''
      });

      const payload = {
        patientId: profile.id,
        dentistId: parseInt(bookingFormData.dentistId),
        appointmentDate: `${bookingFormData.apptDate}T${bookingFormData.apptTime}:00`,
        reason: bookingFormData.apptReason || 'Routine checkup',
        notes: 'Booked via Patient Portal',
        status: 4 // Requested (AppointmentStatus.Requested)
      };

      await api.post('/appointments', payload);
      showToast("Appointment request submitted successfully! It is now pending dental staff confirmation.", "success");
      setShowBookModal(false);
      // Reset form
      setBookingFormData({
        dentistId: '2',
        apptDate: '',
        apptTime: '',
        apptReason: '',
        phone: ''
      });
      fetchProfile(); // Refresh list
      window.dispatchEvent(new Event('appointment-status-updated'));
    } catch (err) {
      console.error(err);
      showToast("Failed to submit appointment request. Please verify inputs.", "danger");
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

      const historyText = res.data.medicalHistory || '';
      const parsedAlgs = [];
      const parsedConds = [];
      
      COMMON_ALLERGIES.forEach(item => {
        if (historyText.toLowerCase().includes(item.label.toLowerCase())) {
          parsedAlgs.push(item.id);
        }
      });
      COMMON_CONDITIONS.forEach(item => {
        if (historyText.toLowerCase().includes(item.label.toLowerCase())) {
          parsedConds.push(item.id);
        }
      });
      
      setSelectedAllergies(parsedAlgs);
      setSelectedConditions(parsedConds);
      
      const customLines = historyText.split('\n').filter(line => {
        const clean = line.trim();
        return !clean.startsWith('• Allergy:') && 
               !clean.startsWith('• Condition:') && 
               clean !== '[Allergies]' && 
               clean !== '[Conditions]' &&
               clean !== '[Custom Notes]';
      });
      setCustomMedicalNotes(customLines.join('\n').trim());

      // Fetch appointments & invoices for this patient
      try {
        const apptsRes = await api.get('/appointments');
        // Filter appointments belonging to this patient
        const patientAppts = apptsRes.data.filter(a => a.patientId === res.data.id);
        setAppointments(patientAppts);

        const invsRes = await api.get(`/billing/invoices/patient/${res.data.id}`);
        setInvoices(invsRes.data);
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
      const allergiesStr = selectedAllergies.map(id => {
        const item = COMMON_ALLERGIES.find(a => a.id === id);
        return item ? `• Allergy: ${item.label}` : '';
      }).filter(Boolean).join('\n');

      const conditionsStr = selectedConditions.map(id => {
        const item = COMMON_CONDITIONS.find(c => c.id === id);
        return item ? `• Condition: ${item.label}` : '';
      }).filter(Boolean).join('\n');

      let combinedHistory = '';
      if (allergiesStr) combinedHistory += `[Allergies]\n${allergiesStr}\n\n`;
      if (conditionsStr) combinedHistory += `[Conditions]\n${conditionsStr}\n\n`;
      if (customMedicalNotes.trim()) combinedHistory += `[Custom Notes]\n${customMedicalNotes.trim()}`;

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        email: user?.email,
        medicalHistory: combinedHistory.trim()
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
                     <div className="p-3 bg-light rounded text-start" style={{ borderLeft: '4px solid #EF4444' }}>
                       <label className="form-label small font-weight-bold text-danger d-flex align-items-center mb-2">
                         <FaExclamationTriangle className="me-2" /> Medical History & Critical Warnings
                       </label>
                       <p className="xsmall text-secondary mb-3">Please select any categories that apply. Toggled pills are immediately highlighted in red inside the Dentist portal to guarantee clinical safety.</p>
                       
                       {/* Drug & Material Allergies */}
                       <div className="mb-3">
                         <div className="xsmall font-weight-bold text-secondary mb-2" style={{ letterSpacing: '0.5px' }}>DRUG & MATERIAL ALLERGIES</div>
                         <div className="d-flex flex-wrap gap-2">
                           {COMMON_ALLERGIES.map(item => {
                             const isSelected = selectedAllergies.includes(item.id);
                             return (
                               <button
                                 key={item.id}
                                 type="button"
                                 onClick={() => {
                                   setSelectedAllergies(prev => 
                                     prev.includes(item.id) 
                                       ? prev.filter(x => x !== item.id) 
                                       : [...prev, item.id]
                                   );
                                 }}
                                 className="btn btn-sm px-3 py-1-5 rounded-pill border"
                                 style={{
                                   fontSize: '12px',
                                   fontWeight: isSelected ? 'bold' : 'normal',
                                   backgroundColor: isSelected ? '#FEE2E2' : '#ffffff',
                                   color: isSelected ? '#991B1B' : '#475569',
                                   borderColor: isSelected ? '#FCA5A5' : '#cbd5e1',
                                   transition: 'all 0.2s ease-in-out'
                                 }}
                               >
                                 {item.label} {isSelected && '✓'}
                               </button>
                             );
                           })}
                         </div>
                       </div>

                       {/* Medical Conditions */}
                       <div className="mb-3">
                         <div className="xsmall font-weight-bold text-secondary mb-2" style={{ letterSpacing: '0.5px' }}>GENERAL MEDICAL CONDITIONS</div>
                         <div className="d-flex flex-wrap gap-2">
                           {COMMON_CONDITIONS.map(item => {
                             const isSelected = selectedConditions.includes(item.id);
                             return (
                               <button
                                 key={item.id}
                                 type="button"
                                 onClick={() => {
                                   setSelectedConditions(prev => 
                                     prev.includes(item.id) 
                                       ? prev.filter(x => x !== item.id) 
                                       : [...prev, item.id]
                                   );
                                 }}
                                 className="btn btn-sm px-3 py-1-5 rounded-pill border"
                                 style={{
                                   fontSize: '12px',
                                   fontWeight: isSelected ? 'bold' : 'normal',
                                   backgroundColor: isSelected ? '#FEF3C7' : '#ffffff',
                                   color: isSelected ? '#92400E' : '#475569',
                                   borderColor: isSelected ? '#FCD34D' : '#cbd5e1',
                                   transition: 'all 0.2s ease-in-out'
                                 }}
                               >
                                 {item.label} {isSelected && '✓'}
                               </button>
                             );
                           })}
                         </div>
                       </div>

                       {/* Additional Notes */}
                       <div className="mt-3">
                         <label className="form-label xsmall font-weight-bold text-secondary">OTHER MEDICAL CONDITIONS / ADDITIONAL NOTES</label>
                         <textarea
                           className="form-control form-control-sm mt-1"
                           value={customMedicalNotes}
                           onChange={(e) => setCustomMedicalNotes(e.target.value)}
                           rows="3"
                           placeholder="Type any other conditions, current medications, or notes here..."
                         ></textarea>
                       </div>
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

  // Profile View mode - Brand new patient with no appointments: Render full screen overlay form (no sidebar, no dashboard header)
  if (appointments.length === 0) {
    return (
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 1050, 
          backgroundColor: '#F8FAFC', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '2rem', 
          overflowY: 'auto' 
        }}
      >
        <style>{`
          .sidebar {
            display: none !important;
          }
          .app-header {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .page-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        `}</style>

        {/* Custom Toast Alert */}
        {toast && (
          <div 
            className={`alert alert-${toast.type} alert-dismissible fade show shadow-sm border-0 d-flex align-items-center mb-3`} 
            role="alert"
            style={{ 
              borderRadius: '12px', 
              position: 'fixed', 
              top: '20px', 
              right: '20px', 
              zIndex: 1100, 
              minWidth: '300px',
              backgroundColor: toast.type === 'success' ? '#ECFDF5' : toast.type === 'warning' ? '#FFFBEB' : '#FEF2F2',
              borderLeft: `6px solid ${toast.type === 'success' ? '#10B981' : toast.type === 'warning' ? '#F59E0B' : '#EF4444'}`,
              color: toast.type === 'success' ? '#047857' : toast.type === 'warning' ? '#B45309' : '#B91C1C'
            }}
          >
            <div className="me-2 font-weight-bold">
              {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠' : '✗'}
            </div>
            <div className="pe-4">{toast.message}</div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setToast(null)}
              style={{ fontSize: '10px' }}
            ></button>
          </div>
        )}

        <div className="card shadow-lg border-0 p-4 bg-white" style={{ borderRadius: '16px', width: '100%', maxWidth: '600px' }}>
          <div className="text-center mb-4">
            <div className="bg-light-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, backgroundColor: '#E0F2FE', color: '#0369A1' }}>
              <FaCalendarAlt size={32} />
            </div>
            <h4 className="font-weight-bold text-dark">Schedule Your First Consultation</h4>
            <p className="text-muted small">
              To activate your clinical record dashboard, please choose a dentist and your preferred time below to request a booking slot.
            </p>
          </div>
          <form onSubmit={handleBookAppointmentSubmit}>
            <div className="row g-3 text-start">
              <div className="col-12">
                <label className="form-label small font-weight-bold">Select Dentist</label>
                <select 
                  name="dentistId" 
                  value={bookingFormData.dentistId} 
                  onChange={handleBookingInputChange} 
                  className="form-select"
                  required
                >
                  <option value="2">Dr. John Smith (Orthodontics)</option>
                  <option value="3">Dr. Sarah Connor (Periodontics)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small font-weight-bold">Preferred Date</label>
                <input 
                  type="date" 
                  name="apptDate" 
                  min={getTodayDateString()}
                  value={bookingFormData.apptDate} 
                  onChange={handleBookingInputChange} 
                  className="form-control" 
                  required 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small font-weight-bold">Preferred Time</label>
                <input 
                  type="time" 
                  name="apptTime" 
                  value={bookingFormData.apptTime} 
                  onChange={handleBookingInputChange} 
                  className="form-control" 
                  required 
                />
              </div>
              <div className="col-12">
                <label className="form-label small font-weight-bold">Contact Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={bookingFormData.phone} 
                  onChange={handleBookingInputChange} 
                  placeholder="e.g. +63 917 123 4567" 
                  className="form-control" 
                  required 
                />
              </div>
              <div className="col-12">
                <label className="form-label small font-weight-bold">Reason for Visit</label>
                <input 
                  type="text" 
                  name="apptReason" 
                  value={bookingFormData.apptReason} 
                  onChange={handleBookingInputChange} 
                  placeholder="e.g. Tooth ache, cleaning, routine checkup" 
                  className="form-control" 
                  required 
                />
              </div>
              <div className="col-12 mt-4">
                <button type="submit" className="btn btn-primary w-100 py-2 font-weight-bold btn-primary-clinic">
                  Request Appointment Slot
                </button>
              </div>
            </div>
          </form>
          <div className="text-center mt-3 border-top pt-2">
            <button 
              onClick={handleSignOutClick} 
              className="btn btn-link text-danger text-decoration-none small font-weight-bold p-0"
            >
              ← Cancel & Sign Out
            </button>
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="modal-header bg-primary text-white py-3">
                  <h6 className="modal-title font-weight-bold text-white mb-0">Confirm Appointment Details</h6>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirmModal(false)}></button>
                </div>
                <div className="modal-body p-4 text-start">
                  <p className="text-muted small mb-3">Please verify that your booking information is correct before submitting:</p>
                  <div className="bg-light p-3 rounded" style={{ fontSize: '13px' }}>
                    <div className="mb-2"><strong>Dentist:</strong> {bookingFormData.dentistId === '2' ? 'Dr. John Smith (Orthodontics)' : 'Dr. Sarah Connor (Periodontics)'}</div>
                    <div className="mb-2"><strong>Preferred Date:</strong> {bookingFormData.apptDate}</div>
                    <div className="mb-2"><strong>Preferred Time:</strong> {bookingFormData.apptTime}</div>
                    <div className="mb-2"><strong>Contact Phone:</strong> {bookingFormData.phone || profile?.phone}</div>
                    <div><strong>Reason for Visit:</strong> {bookingFormData.apptReason || 'Routine checkup'}</div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0 py-3">
                  <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={() => setShowConfirmModal(false)}>
                    Go Back & Edit
                  </button>
                  <button type="button" className="btn btn-sm btn-primary px-4 btn-primary-clinic" onClick={handleConfirmBooking}>
                    Yes, Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Profile View mode - Confirmed / Active patient: Render full dashboard layout
  return (
    <div className="container py-4">
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-pulse {
          animation: pulse 2s infinite ease-in-out;
        }
      `}</style>
      {/* Custom Toast Alert */}
      {toast && (
        <div 
          className={`alert alert-${toast.type} alert-dismissible fade show shadow-sm border-0 d-flex align-items-center mb-3`} 
          role="alert"
          style={{ 
            borderRadius: '12px', 
            position: 'fixed', 
            top: '20px', 
            right: '20px', 
            zIndex: 1050, 
            minWidth: '300px',
            backgroundColor: toast.type === 'success' ? '#ECFDF5' : toast.type === 'warning' ? '#FFFBEB' : '#FEF2F2',
            borderLeft: `6px solid ${toast.type === 'success' ? '#10B981' : toast.type === 'warning' ? '#F59E0B' : '#EF4444'}`,
            color: toast.type === 'success' ? '#047857' : toast.type === 'warning' ? '#B45309' : '#B91C1C'
          }}
        >
          <div className="me-2 font-weight-bold">
            {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠' : '✗'}
          </div>
          <div className="pe-4">{toast.message}</div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setToast(null)}
            style={{ fontSize: '10px' }}
          ></button>
        </div>
      )}
      {/* Header Profile Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="font-weight-bold mb-0 text-primary" style={{ letterSpacing: '-0.5px' }}>My Patient Profile</h2>
          <p className="text-muted small mb-0">Welcome back, {profile.firstName}! View your registered info, appointments, and bills.</p>
        </div>
        {hasConfirmed && (
          <button 
            className="btn btn-outline-primary btn-sm d-flex align-items-center shadow-sm"
            onClick={() => setIsEditing(true)}
          >
            <FaEdit className="me-2" /> Edit Info
          </button>
        )}
      </div>

      {/* Dynamic Status / Appointment Notice Banners */}
      {activeAppt ? (
        activeAppt.status === 4 ? (
          <div className="alert d-flex align-items-center mb-4 shadow-sm border-0 p-4" 
               style={{ 
                 borderRadius: '16px', 
                 backgroundColor: '#FFFBEB', 
                 borderLeft: '8px solid #F59E0B', 
                 color: '#B45309',
                 boxShadow: '0 4px 20px rgba(245, 158, 11, 0.05)'
               }}>
            <div className="me-3 bg-warning text-white rounded-circle d-flex align-items-center justify-content-center shadow animate-pulse" 
                 style={{ 
                   width: '50px', 
                   height: '50px', 
                   backgroundColor: '#F59E0B'
                 }}>
              <FaClock size={24} />
            </div>
            <div>
              <h5 className="font-weight-bold mb-1" style={{ color: '#92400E', letterSpacing: '-0.3px' }}>Appointment Confirmation Pending</h5>
              <p className="small mb-0" style={{ opacity: 0.95 }}>
                Your appointment request for <strong>{new Date(activeAppt.appointmentDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> at <strong>{new Date(activeAppt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> is currently pending confirmation from our clinic staff. We will call you shortly to verify.
              </p>
            </div>
          </div>
        ) : (
          <div className="alert alert-success d-flex align-items-center mb-4 shadow-sm border-0 p-3" style={{ borderRadius: '12px', backgroundColor: '#ECFDF5', borderLeft: '6px solid #10B981', color: '#047857' }}>
            <div className="me-3 bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: '#10B981' }}>
              <FaCheckCircle size={20} />
            </div>
            <div>
              <h6 className="font-weight-bold mb-1" style={{ color: '#065F46' }}>Confirmed Schedule: Action Required</h6>
              <p className="small mb-0">
                Your appointment has been approved! Please visit the dental clinic on <strong>{new Date(activeAppt.appointmentDate).toLocaleDateString()}</strong> at <strong>{new Date(activeAppt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>. Either you or our dental staff will complete your clinical details and medical history during this visit.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="alert alert-info d-flex align-items-center mb-4 shadow-sm border-0 p-3" style={{ borderRadius: '12px', backgroundColor: '#F0F9FF', borderLeft: '6px solid #0EA5E9', color: '#0369A1' }}>
          <div className="me-3 bg-info text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: '#0EA5E9' }}>
            <FaCalendarAlt size={20} />
          </div>
          <div>
            <h6 className="font-weight-bold mb-1" style={{ color: '#075985' }}>Welcome to DentalVision</h6>
            <p className="small mb-0">
              You do not have any active appointments scheduled. Click <strong>"Book Appointment"</strong> below to request a clinical consultation.
            </p>
          </div>
        </div>
      )}

      <div className="row g-4">
        {appointments.length === 0 ? (
          /* State A: Brand new patient with no appointments. Center the Booking form */
          <div className="col-md-8 mx-auto">
            <div className="card shadow border-0 p-4 bg-white" style={{ borderRadius: '16px' }}>
              <div className="text-center mb-4">
                <div className="bg-light-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, backgroundColor: '#E0F2FE', color: '#0369A1' }}>
                  <FaCalendarAlt size={32} />
                </div>
                <h4 className="font-weight-bold text-dark">Schedule Your First Consultation</h4>
                <p className="text-muted small">
                  To activate your clinical record dashboard, please choose a dentist and your preferred time below to request a booking slot.
                </p>
              </div>
              <form onSubmit={handleBookAppointmentSubmit}>
                <div className="row g-3">
                  <div className="col-12 text-start">
                    <label className="form-label small font-weight-bold">Select Dentist</label>
                    <select 
                      name="dentistId" 
                      value={bookingFormData.dentistId} 
                      onChange={handleBookingInputChange} 
                      className="form-select"
                      required
                    >
                      <option value="2">Dr. John Smith (Orthodontics)</option>
                      <option value="3">Dr. Sarah Connor (Periodontics)</option>
                    </select>
                  </div>
                  <div className="col-md-6 text-start">
                    <label className="form-label small font-weight-bold">Preferred Date</label>
                    <input 
                      type="date" 
                      name="apptDate" 
                      min={getTodayDateString()}
                      value={bookingFormData.apptDate} 
                      onChange={handleBookingInputChange} 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="col-md-6 text-start">
                    <label className="form-label small font-weight-bold">Preferred Time</label>
                    <input 
                      type="time" 
                      name="apptTime" 
                      value={bookingFormData.apptTime} 
                      onChange={handleBookingInputChange} 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="col-12 text-start">
                    <label className="form-label small font-weight-bold">Contact Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={bookingFormData.phone} 
                      onChange={handleBookingInputChange} 
                      placeholder="e.g. +63 917 123 4567" 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="col-12 text-start">
                    <label className="form-label small font-weight-bold">Reason for Visit</label>
                    <input 
                      type="text" 
                      name="apptReason" 
                      value={bookingFormData.apptReason} 
                      onChange={handleBookingInputChange} 
                      placeholder="e.g. Tooth ache, cleaning, routine checkup" 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="col-12 mt-4">
                    <button type="submit" className="btn btn-primary w-100 py-2 font-weight-bold btn-primary-clinic">
                      Request Appointment Slot
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* State B & C: Has appointments. Show left column (locked or unlocked) and right column */
          <>
            {/* Left Column */}
            <div className="col-md-5">
              {!hasConfirmed ? (
                /* Premium Glassmorphic Locked Profile Card */
                <div className="card shadow-sm border-0 mb-4 position-relative overflow-hidden" style={{ borderRadius: '16px', minHeight: '350px' }}>
                  {/* Blurred Mock Profile Content */}
                  <div style={{ filter: 'blur(5px)', opacity: 0.35, pointerEvents: 'none', userSelect: 'none' }}>
                    <div className="bg-primary p-4 text-white d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
                      <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '64px', height: '64px' }}>
                        <FaUser size={30} />
                      </div>
                      <div className="ms-3 text-start">
                        <h5 className="mb-0 font-weight-bold text-white">{profile?.firstName} {profile?.lastName}</h5>
                        <span className="badge bg-light text-dark font-weight-bold xsmall mt-1 px-2 py-1">ID: PAT-XXXX</span>
                      </div>
                    </div>
                    <div className="card-body p-4 bg-white text-start">
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="text-muted xsmall font-weight-bold">DATE OF BIRTH</div>
                          <div className="small font-weight-bold">January 1, 2000</div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted xsmall font-weight-bold">GENDER</div>
                          <div className="small font-weight-bold">Male</div>
                        </div>
                        <div className="col-12 border-top pt-2">
                          <div className="text-muted xsmall font-weight-bold">CONTACT NUMBER</div>
                          <div className="small font-weight-bold">+63 917 123 4567</div>
                        </div>
                        <div className="col-12 border-top pt-2">
                          <div className="text-muted xsmall font-weight-bold">EMAIL ADDRESS</div>
                          <div className="small font-weight-bold">{profile?.email}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Glass Overlay with Lock Message */}
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(2px)' }}>
                    <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle animate-pulse shadow-sm" style={{ width: 70, height: 70, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                      <FaLock size={28} />
                    </div>
                    <h5 className="font-weight-bold text-dark mb-2">Clinical Details Locked</h5>
                    <p className="text-muted small mb-0" style={{ maxWidth: '280px', lineHeight: '1.5' }}>
                      Your medical history and clinical details card will unlock automatically once our clinic staff verifies and approves your pending appointment schedule.
                    </p>
                  </div>
                </div>
              ) : (
                /* Normal profile cards */
                <>
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
                            {new Date(profile.dateOfBirth).getFullYear() === 2000 && 
                             new Date(profile.dateOfBirth).getMonth() === 0 && 
                             new Date(profile.dateOfBirth).getDate() === 1 
                              ? "Not provided yet" 
                              : new Date(profile.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted xsmall font-weight-bold">GENDER</div>
                          <div className="small font-weight-bold" style={{ color: '#1E293B' }}>{profile.gender || 'Not provided yet'}</div>
                        </div>
                        <div className="col-12 border-top pt-2">
                          <div className="text-muted xsmall font-weight-bold">CONTACT NUMBER</div>
                          <div className="small font-weight-bold" style={{ color: '#1E293B' }}>
                            {profile.phone === '0000000000' ? 'Not provided yet' : profile.phone}
                          </div>
                        </div>
                        <div className="col-12 border-top pt-2">
                          <div className="text-muted xsmall font-weight-bold">EMAIL ADDRESS</div>
                          <div className="small font-weight-bold" style={{ color: '#1E293B' }}>{profile.email}</div>
                        </div>
                        <div className="col-12 border-top pt-2">
                          <div className="text-muted xsmall font-weight-bold">HOME ADDRESS</div>
                          <div className="small text-muted">{profile.address || 'Not provided yet'}</div>
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
                          {profile.medicalHistory || "No declared allergies or medical conditions yet (Update at clinic)."}
                        </p>
                      </div>
                      <p className="text-muted xsmall mt-2 mb-0">
                        * Note: This warning card is immediately highlighted in red inside the Dentist portal to ensure clinical safety during consultations.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column */}
            <div className="col-md-7">
              {/* Appointments list */}
              <div className="card shadow-sm border-0 mb-4 p-4" style={{ borderRadius: '16px' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="font-weight-bold text-dark mb-0 d-flex align-items-center">
                    <FaCalendarAlt size={18} className="text-primary me-2" /> My Appointments
                  </h5>
                  {/* Allow booking additional slots only if they already have confirmed status to avoid spamming slots while pending */}
                  {hasConfirmed && (
                    <button 
                      onClick={() => setShowBookModal(true)} 
                      className="btn btn-sm btn-primary px-3 rounded-pill btn-primary-clinic"
                    >
                      Book Appointment
                    </button>
                  )}
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
                            min={getTodayDateString()}
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
                          <label className="form-label xsmall font-weight-bold">Contact Phone Number</label>
                          <input 
                            type="tel" 
                            name="phone" 
                            value={bookingFormData.phone} 
                            onChange={handleBookingInputChange} 
                            placeholder="e.g. +63 917 123 4567" 
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
                            className="btn btn-sm btn-primary px-3 text-white btn-primary-clinic"
                          >
                            Request Booking
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

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
                            <span className="font-weight-bold" style={{ 
                              color: appt.status === 1 ? '#059669' : 
                                     appt.status === 0 ? '#2563EB' : 
                                     appt.status === 4 ? '#D97706' : 
                                     '#DC2626',
                              fontSize: '13px'
                            }}>
                              ● {
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
              </div>

              {/* Invoices list */}
              {hasConfirmed && (
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
                                <span className="font-weight-bold" style={{ 
                                  color: inv.paymentStatus === 'Paid' || inv.paymentStatus === 2 ? '#059669' :
                                         inv.paymentStatus === 'PartiallyPaid' || inv.paymentStatus === 1 ? '#D97706' :
                                         '#DC2626',
                                  fontSize: '13px'
                                }}>
                                  ● {inv.paymentStatus === 0 ? 'Unpaid' : inv.paymentStatus === 1 ? 'Partially Paid' : inv.paymentStatus === 2 ? 'Paid' : inv.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white py-3">
                <h6 className="modal-title font-weight-bold text-white mb-0">Confirm Appointment Details</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirmModal(false)}></button>
              </div>
              <div className="modal-body p-4 text-start">
                <p className="text-muted small mb-3">Please verify that your booking information is correct before submitting:</p>
                <div className="bg-light p-3 rounded" style={{ fontSize: '13px' }}>
                  <div className="mb-2"><strong>Dentist:</strong> {bookingFormData.dentistId === '2' ? 'Dr. John Smith (Orthodontics)' : 'Dr. Sarah Connor (Periodontics)'}</div>
                  <div className="mb-2"><strong>Preferred Date:</strong> {bookingFormData.apptDate}</div>
                  <div className="mb-2"><strong>Preferred Time:</strong> {bookingFormData.apptTime}</div>
                  <div className="mb-2"><strong>Contact Phone:</strong> {bookingFormData.phone || profile?.phone}</div>
                  <div><strong>Reason for Visit:</strong> {bookingFormData.apptReason || 'Routine checkup'}</div>
                </div>
              </div>
              <div className="modal-footer bg-light border-0 py-3">
                <button type="button" className="btn type-button btn-sm btn-outline-secondary px-3" onClick={() => setShowConfirmModal(false)}>
                  Go Back & Edit
                </button>
                <button type="button" className="btn type-button btn-sm btn-primary px-4 btn-primary-clinic" onClick={handleConfirmBooking}>
                  Yes, Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
