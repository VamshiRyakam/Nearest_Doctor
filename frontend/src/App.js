import React, { useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './AuthContext'; // Import useAuth hook

import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import Chat from './components/Chat';
import DoctorSearch from './components/DoctorSearch';
import PatientProfile from './components/PatientProfile';
import DoctorProfile from './components/DoctorProfile';
import CompletedAppointments from './components/CompletedAppointments';
import PatientAppointments from './components/PatientAppointments';
import RoleSelection from './components/RoleSelection'; // Import RoleSelection

// A protected route component that uses AuthContext
const ProtectedRoute = ({ children }) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    } else if (user && user.role === 'unassigned' && window.location.pathname !== '/role-selection') {
      navigate("/role-selection", { replace: true });
    }
  }, [token, user, navigate]);

  if (!token) {
    return null; // or a loading spinner
  }

  // If user is unassigned, render RoleSelection if not already on that path
  if (user && user.role === 'unassigned' && window.location.pathname !== '/role-selection') {
    return null; // The useEffect will handle the navigation
  }

  return children;
};

function App() {
  const { token, user } = useAuth();
  const navigate = useNavigate(); // For redirection within App component

  useEffect(() => {
    // Redirect unassigned users to role selection page upon login
    if (user && user.role === 'unassigned' && window.location.pathname !== '/role-selection') {
      navigate('/role-selection', { replace: true });
    } else if (user && user.role !== 'unassigned' && (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/')) {
      // If user has a role and tries to access login/register/root, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate, token]);


  const renderDashboard = () => {
    switch (user?.role) {
      case 'patient':
        return <PatientDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'unassigned':
        return <Navigate to="/role-selection" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  const renderProfile = () => {
    switch (user?.role) {
      case 'patient':
        return <PatientProfile />;
      case 'doctor':
        return <DoctorProfile />;
      default:
        return <Navigate to="/dashboard" replace />; // Or handle unauthorized access
    }
  };

  return (
    <div className="App">
      <Navbar /> {/* Navbar will use useAuth internally */}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} /> {/* Login will use useAuth internally */}
          <Route path="/register" element={<Register />} />
          <Route path="/role-selection" element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctors"
            element={
              <ProtectedRoute>
                <DoctorSearch />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {renderDashboard()}
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                {renderProfile()}
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments/completed"
            element={
              <ProtectedRoute>
                <CompletedAppointments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments/mine"
            element={
              <ProtectedRoute>
                <PatientAppointments />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;