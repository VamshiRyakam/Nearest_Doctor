import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const RoleSelection = () => {
  const { token, user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleRoleSelection = async (selectedRole) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/users/me/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role');
      }

      // Backend returns a new JWT with the updated role
      login(data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error updating role:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Already has a role — redirect to dashboard
  if (user && user.role && user.role !== 'unassigned') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="role-selection-container">
      <div className="role-selection-card surface-card">
        <h2>Choose Your Role</h2>
        <p className="role-selection-subtitle">How will you be using Nearest Doctor?</p>

        {error && <p className="error-message">{error}</p>}

        <div className="role-selection-options">
          <button
            className="role-option-btn role-patient"
            onClick={() => handleRoleSelection('patient')}
            disabled={loading}
          >
            <span className="role-emoji">🧑‍🦱</span>
            <span className="role-label">Patient</span>
          </button>

          <button
            className="role-option-btn role-doctor"
            onClick={() => handleRoleSelection('doctor')}
            disabled={loading}
          >
            <span className="role-emoji">🧑‍⚕️</span>
            <span className="role-label">Doctor</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
