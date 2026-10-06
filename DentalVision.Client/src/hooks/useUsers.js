import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

let cachedUsersList = null;
let usersFetchPromise = null;

export const useUsers = () => {
  const [users, setUsers] = useState(cachedUsersList || []);
  const [loading, setLoading] = useState(!cachedUsersList);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async (force = false) => {
    try {
      if (cachedUsersList && !force) {
        setUsers(cachedUsersList);
        setLoading(false);
        return cachedUsersList;
      }

      if (!usersFetchPromise || force) {
        usersFetchPromise = api.get('/users')
          .then(res => {
            const data = Array.isArray(res.data) ? res.data : [];
            cachedUsersList = data;
            return data;
          })
          .catch(err => {
            console.error("Error loading users list:", err);
            throw err;
          })
          .finally(() => {
            usersFetchPromise = null;
          });
      }

      const data = await usersFetchPromise;
      setUsers(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load staff accounts");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: () => fetchUsers(true)
  };
};

export default useUsers;
