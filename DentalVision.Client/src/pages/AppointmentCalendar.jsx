import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FaCalendarPlus, FaUser, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useForm } from 'react-hook-form';

const AppointmentCalendar = () => {
  const [appointments, setAppointments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { hasRole, user } = useAuth();
  
  const { register, handleSubmit, reset } = useForm();

  // Seeded dentists mapping
  const dentists = [
    { id: 2, name: "Dr. John Smith (Orthodontics)" },
    { id: 3, name: "Dr. Sarah Connor (Periodontics)" },
    { id: 4, name: "Dr. Michael Bluth (Endodontics)" },
    { id: 5, name: "Dr. Emily Watson (Pediatric)" },
    { id: 6, name: "Dr. Robert Miller (Prostrosthodontics)" }
  ];

  const fetchAppointments = async (date = '') => {
    try {
      const response = await api.get(`/appointments${date ? `?date=${date}` : ''}`);
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/appointments');
      const pending = response.data.filter(a => a.status === 4);
      setPendingRequests(pending);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (error) {
      console.error("Error loading patients for scheduler:", error);
    }
  };

  useEffect(() => {
    fetchAppointments(selectedDate);
    fetchPendingRequests();
  }, [selectedDate]);

  useEffect(() => {
    if (showModal) {
      fetchPatients();
    }
  }, [showModal]);

  const onSubmit = async (data) => {
    try {
      // Assemble datetime string
      const datetime = `${data.appointmentDate}T${data.appointmentTime}:00`;
      const payload = {
        patientId: parseInt(data.patientId),
        dentistId: parseInt(data.dentistId),
        appointmentDate: datetime,
        reason: data.reason,
        notes: data.notes
      };

      await api.post('/appointments', payload);
      setShowModal(false);
      reset();
      fetchAppointments(selectedDate);
      fetchPendingRequests();
    } catch (error) {
      console.error("Error scheduling appointment:", error);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      fetchAppointments(selectedDate);
      fetchPendingRequests();
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="font-weight-bold m-0">Appointment Calendar</h3>
        {hasRole(['Dental Staff', 'Administrator']) && (
          <button 
            className="btn btn-primary-clinic d-flex align-items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <FaCalendarPlus /> Schedule Appointment
          </button>
        )}
      </div>

      <div className="row g-4">
        {/* Date Selector Card */}
        <div className="col-md-3">
          <div className="clinic-card">
            <h5 className="font-weight-bold mb-3">Select Date</h5>
            <input 
              type="date" 
              className="form-control" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
            <div className="mt-3 text-muted small">
              Viewing scheduled bookings for this date.
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="col-md-9">
          {/* Pending Confirmation Requests Section */}
          <div className="clinic-card mb-4 text-start" style={{ borderLeft: '4px solid #F59E0B' }}>
            <h5 className="font-weight-bold mb-3 d-flex align-items-center justify-content-between">
              <span style={{ color: '#92400E' }}>Pending Confirmation Requests</span>
              {pendingRequests.length > 0 && (
                <span className="font-weight-bold" style={{ fontSize: '13px', color: '#B45309' }}>
                  ({pendingRequests.length} pending)
                </span>
              )}
            </h5>
            {pendingRequests.length === 0 ? (
              <p className="text-muted small py-2 m-0">No pending appointment confirmation requests.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {pendingRequests.map(appt => (
                  <div key={appt.id} className="border rounded p-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-warning text-white rounded p-2" style={{ backgroundColor: '#F59E0B' }}>
                        <FaClock size={16} />
                      </div>
                      <div>
                        <span className="small text-muted font-weight-bold d-block">
                          {new Date(appt.appointmentDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at{' '}
                          {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="small text-muted d-block mt-1">
                          Patient: <strong>{appt.patientName}</strong> {appt.patientPhone && appt.patientPhone !== '0000000000' && (
                            <span className="text-primary font-weight-bold"> ({appt.patientPhone})</span>
                          )} | Dentist: <strong>{appt.dentistName}</strong>
                        </span>
                        <span className="xsmall text-secondary d-block mt-1">Reason: {appt.reason || 'Routine visit'}</span>
                      </div>
                    </div>
                    
                    <div className="d-flex gap-1">
                      <button 
                        onClick={() => handleUpdateStatus(appt.id, 0)} // Approve: Scheduled
                        className="btn btn-sm btn-success py-1 px-3"
                        style={{ fontSize: 11, fontWeight: 'bold' }}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(appt.id, 2)} // Reject: Cancelled
                        className="btn btn-sm btn-outline-danger py-1 px-3"
                        style={{ fontSize: 11 }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="clinic-card text-start">
            <h5 className="font-weight-bold mb-3">Booked Consultations</h5>
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
            ) : appointments.length === 0 ? (
              <p className="text-muted py-4">No appointments scheduled for this date.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {appointments.map(appt => (
                  <div key={appt.id} className="border rounded p-3 d-flex justify-content-between align-items-center bg-light">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary text-white rounded p-2" style={{ backgroundColor: '#2563EB' }}>
                        <FaClock size={18} />
                      </div>
                      <div>
                        <h6 className="m-0 font-weight-bold" style={{ color: '#1E293B' }}>
                          {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </h6>
                        <span className="small text-muted d-block mt-1">
                          Patient: <strong>{appt.patientName}</strong> {appt.patientPhone && appt.patientPhone !== '0000000000' && (
                            <span className="text-primary font-weight-bold"> ({appt.patientPhone})</span>
                          )} | Dentist: <strong>{appt.dentistName}</strong>
                        </span>
                        <span className="xsmall text-secondary d-block mt-1">Reason: {appt.reason || 'Routine visit'}</span>
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center gap-2">
                       <span className="font-weight-bold" style={{ 
                         color: appt.status === 0 ? '#2563EB' : 
                                appt.status === 1 ? '#059669' : 
                                appt.status === 4 ? '#D97706' : 
                                '#DC2626',
                         fontSize: '13px'
                       }}>
                         ● {
                           appt.status === 0 ? 'Scheduled' : 
                           appt.status === 1 ? 'Completed' : 
                           appt.status === 2 ? 'Cancelled' : 
                           appt.status === 3 ? 'No Show' : 
                           'Pending Confirmation'
                         }
                       </span>
                      
                      {appt.status === 4 && (
                        <div className="d-flex gap-1">
                          <button 
                            onClick={() => handleUpdateStatus(appt.id, 0)} // Approve: Scheduled
                            className="btn btn-sm btn-success py-1"
                            style={{ fontSize: 10, fontWeight: 'bold' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(appt.id, 2)} // Reject: Cancelled
                            className="btn btn-sm btn-outline-danger py-1"
                            style={{ fontSize: 10 }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {appt.status === 0 && hasRole(['Dentist']) && user?.id === appt.dentistId && (
                        <button 
                          onClick={() => handleUpdateStatus(appt.id, 1)} // Mark completed
                          className="btn btn-sm btn-outline-success py-1 d-flex align-items-center gap-1"
                          style={{ fontSize: 11 }}
                        >
                          <FaCheckCircle /> Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showModal && createPortal(
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white border-0 py-3" style={{ backgroundColor: '#2563EB' }}>
                <h5 className="modal-title font-weight-bold text-white">Schedule Appointment</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">Select Patient</label>
                      <select className="form-select" {...register("patientId", { required: true })}>
                        <option value="">-- Choose Patient --</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">Select Dentist</label>
                      <select className="form-select" {...register("dentistId", { required: true })}>
                        <option value="">-- Choose Dentist --</option>
                        {dentists.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Select Date</label>
                      <input type="date" className="form-control" {...register("appointmentDate", { required: true })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small font-weight-bold">Select Time</label>
                      <input type="time" className="form-control" {...register("appointmentTime", { required: true })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">Reason for Visit</label>
                      <input type="text" className="form-control" placeholder="e.g. Scaling, filling, checkup" {...register("reason")} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small font-weight-bold">Notes</label>
                      <textarea className="form-control" rows="2" placeholder="Any additional notes..." {...register("notes")}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-clinic">Book Slot</button>
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

export default AppointmentCalendar;
