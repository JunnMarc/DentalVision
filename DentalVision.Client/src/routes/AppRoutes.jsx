import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../layouts/AppLayout';

import Login from '../pages/Login';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import PatientList from '../pages/PatientList';
import PatientProfile from '../pages/PatientProfile';
import AppointmentCalendar from '../pages/AppointmentCalendar';
import Billing from '../pages/Billing';
import UploadImage from '../pages/UploadImage';
import PlaqueValidation from '../pages/PlaqueValidation';
import ClinicalReports from '../pages/ClinicalReports';
import Settings from '../pages/Settings';
import AuditLogs from '../pages/AuditLogs';
import Users from '../pages/Users';
import ReportDetails from '../pages/ReportDetails';
import MyProfile from '../pages/MyProfile';

// Route Guard for authenticated users
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, token, hasRole } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    if (user.role === 4 || user.role === 'Patient') {
      return <Navigate to="/my-profile" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Private Routes */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dentist', 'Dental Staff', 'SuperAdministrator']}>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/patients" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dentist', 'Dental Staff']}>
            <PatientList />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/patients/:id" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dentist', 'Dental Staff']}>
            <PatientProfile />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/appointments" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dentist', 'Dental Staff']}>
            <AppointmentCalendar />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/billing" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dental Staff']}>
            <Billing />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/plaque/upload" 
        element={
          <PrivateRoute allowedRoles={['Dentist']}>
            <UploadImage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/plaque/validate/:analysisId" 
        element={
          <PrivateRoute allowedRoles={['Dentist']}>
            <PlaqueValidation />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dentist']}>
            <ClinicalReports />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/logs" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'SuperAdministrator']}>
            <AuditLogs />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'SuperAdministrator']}>
            <Settings />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <PrivateRoute allowedRoles={['Administrator']}>
            <Users />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/reports/:id" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dentist']}>
            <ReportDetails />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/my-profile" 
        element={
          <PrivateRoute allowedRoles={['Patient']}>
            <MyProfile />
          </PrivateRoute>
        } 
      />

      {/* Fallback redirection */}
      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
};

// Dynamic fallback redirect component
const FallbackRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 4 || user.role === 'Patient') {
    return <Navigate to="/my-profile" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export default AppRoutes;
