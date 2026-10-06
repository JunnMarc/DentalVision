import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

let cachedPatientsList = null;

export const usePatients = (initialSearch = '') => {
  const [patients, setPatients] = useState(initialSearch ? [] : (cachedPatientsList || []));
  const [loading, setLoading] = useState(!initialSearch && !cachedPatientsList);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async (searchTerm = '', force = false) => {
    try {
      if (!searchTerm && cachedPatientsList && !force) {
        setPatients(cachedPatientsList);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError(null);
      const url = searchTerm ? `/patients?search=${encodeURIComponent(searchTerm)}` : '/patients';
      const res = await api.get(url);
      setPatients(res.data);
      if (!searchTerm) {
        cachedPatientsList = res.data;
      }
      return res.data;
    } catch (err) {
      console.error("Error loading patients:", err);
      setError(err.response?.data?.message || "Failed to load patient records");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients(initialSearch);
  }, [fetchPatients, initialSearch]);

  return {
    patients,
    loading,
    error,
    refetch: (search) => fetchPatients(search !== undefined ? search : initialSearch, true)
  };
};

export default usePatients;
