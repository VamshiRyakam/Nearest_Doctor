import React from 'react';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';
import DoctorAppointments from './DoctorAppointments';

const CompletedAppointments = () => {
  const { user } = useAuth();

  if (user?.role !== 'doctor') {
    return <Navigate to="/dashboard" replace />;
  }

  return <DoctorAppointments mode="completed" />;
};

export default CompletedAppointments;
