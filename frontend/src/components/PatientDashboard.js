import React from 'react';
import { Link } from 'react-router-dom';

const PatientDashboard = () => {
  return (
    <div className="dashboard-container">
      <h2>Welcome to Nearest Doctor</h2>
      <p className="dashboard-subtitle">Your decentralized healthcare companion</p>
      <div className="dashboard-grid">
        <Link to="/chat" className="dashboard-card">
          <div className="dashboard-card-icon">💬</div>
          <h3>AI Chat</h3>
          <p>Describe your symptoms and get an AI-powered preliminary diagnosis.</p>
        </Link>
        <Link to="/doctors" className="dashboard-card">
          <div className="dashboard-card-icon">🩺</div>
          <h3>Find Doctors</h3>
          <p>Search for verified doctors in your area.</p>
        </Link>
      </div>
    </div>
  );
};

export default PatientDashboard;
