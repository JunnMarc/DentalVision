import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useAppointments = (initialDate = '') => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const fetchAppointments = useCallback(async (dateFilter = selectedDate) => {
    try {
      setLoading(true);
      const url = dateFilter ? `/appointments?date=${dateFilter}` : '/appointments';
      const res = await api.get(url);
      setAppointments(res.data);
      return res.data;
    } catch (err) {
      console.error("Error loading appointments:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [fetchAppointments, selectedDate]);

  const updateStatus = async (id, status, notes = null) => {
    try {
      await api.put(`/appointments/${id}/status`, { status, notes });
      await fetchAppointments();
      return true;
    } catch (err) {
      console.error("Error updating appointment status:", err);
      throw err;
    }
  };

  const updateIntake = async (id, isIntakeCompleted, intakeNotes = '') => {
    try {
      await api.put(`/appointments/${id}/intake`, { isIntakeCompleted, intakeNotes });
      await fetchAppointments();
      return true;
    } catch (err) {
      console.error("Error updating intake notes:", err);
      throw err;
    }
  };

  return {
    appointments,
    loading,
    selectedDate,
    setSelectedDate,
    refetch: fetchAppointments,
    updateStatus,
    updateIntake
  };
};

export default useAppointments;
