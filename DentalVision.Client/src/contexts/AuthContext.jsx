import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: jwtToken, user: userProfile } = response.data;

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userProfile));

      setToken(jwtToken);
      setUser(userProfile);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Invalid credentials"
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    // user.role is returned as a number or string name. Enums are mapped as numbers, e.g., 1 for Admin, 2 for Dentist, 3 for Receptionist, 
    // or as names, e.g. "Administrator", "Dentist", "Receptionist". Let's check both to be safe!
    const roleMap = {
      1: "Administrator",
      2: "Dentist",
      3: "Receptionist"
    };
    const roleName = typeof user.role === 'number' ? roleMap[user.role] : user.role;
    return allowedRoles.includes(roleName);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasRole
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
