import React from 'react';
import { useAuth } from '../AuthContext';
import DoctorVerificationForm from './DoctorVerificationForm';
import DoctorAppointments from './DoctorAppointments';
import { Link } from 'react-router-dom';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const status = user?.verificationStatus;

  // Unverified or rejected — show the verification form
  if (status === 'unverified' || status === 'rejected') {
    return <DoctorVerificationForm />;
  }

  // Pending — show waiting message
  if (status === 'pending') {
    return <DoctorVerificationForm />;
  }

  // Verified — full dashboard
  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Welcome back</p>
          <h2>Doctor Dashboard</h2>
        </div>
        <div className="dashboard-actions">
          <span className="verified-badge">&#10003; Verified</span>
          <Link to="/appointments/completed" className="pill-button secondary">Completed</Link>
        </div>
      </div>
      <DoctorAppointments />
    </div>
  );
};

export default DoctorDashboard;
