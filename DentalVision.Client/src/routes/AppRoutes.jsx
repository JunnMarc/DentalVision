import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../layouts/AppLayout';

import Login from '../pages/Login';
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

// Route Guard for authenticated users
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, token, hasRole } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Private Routes */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dentist', 'Receptionist']}>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/patients" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dentist', 'Receptionist']}>
            <PatientList />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/patients/:id" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dentist', 'Receptionist']}>
            <PatientProfile />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/appointments" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Dentist', 'Receptionist']}>
            <AppointmentCalendar />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/billing" 
        element={
          <PrivateRoute allowedRoles={['Administrator', 'Receptionist']}>
            <Billing />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/plaque/upload" 
        element={
          <PrivateRoute allowedRoles={['Dentist', 'Receptionist']}>
            <UploadImage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/plaque/validate/:analysisId" 
        element={
          <PrivateRoute allowedRoles={['Dentist', 'Administrator']}>
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
          <PrivateRoute allowedRoles={['Administrator']}>
            <AuditLogs />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <PrivateRoute allowedRoles={['Administrator']}>
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

      {/* Fallback redirection */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
