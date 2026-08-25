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

      // Decode JWT token to extract and cache the TenantSlug
      try {
        const payloadBase64 = jwtToken.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const decoded = JSON.parse(payloadJson);
        if (decoded && decoded.TenantSlug) {
          localStorage.setItem('tenant_slug', decoded.TenantSlug);
        }
      } catch (jwtError) {
        console.error("Failed to parse TenantSlug claim from token:", jwtError);
      }

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
    // Map enums or string names to role display names
    const roleMap = {
      1: "Administrator",
      2: "Dentist",
      3: "Dental Staff",
      4: "Patient",
      5: "SuperAdministrator",
      "Administrator": "Administrator",
      "Dentist": "Dentist",
      "Receptionist": "Dental Staff",
      "Dental Staff": "Dental Staff",
      "Patient": "Patient",
      "SuperAdministrator": "SuperAdministrator"
    };
    const roleName = roleMap[user.role] || user.role;
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
