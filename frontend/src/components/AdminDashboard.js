import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [rejectReasons, setRejectReasons] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchPendingDoctors = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/admin/pending-doctors`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingDoctors(data);
      }
    } catch (error) {
      console.error('Error fetching pending doctors:', error);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    fetchPendingDoctors();
  }, [fetchPendingDoctors]);

  const handleApprove = async (doctorId) => {
    setActionLoading((prev) => ({ ...prev, [doctorId]: true }));
    setMessage('');
    try {
      const response = await fetch(`${apiUrl}/api/admin/approve-doctor/${doctorId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setMessage(data.message);
      fetchPendingDoctors();
    } catch (error) {
      console.error('Error approving doctor:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  const handleReject = async (doctorId) => {
    const reason = rejectReasons[doctorId];
    if (!reason || !reason.trim()) {
      setMessage('Please provide a rejection reason.');
      return;
    }
    setActionLoading((prev) => ({ ...prev, [doctorId]: true }));
    setMessage('');
    try {
      const response = await fetch(`${apiUrl}/api/admin/reject-doctor/${doctorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      setMessage(data.message);
      setRejectReasons((prev) => ({ ...prev, [doctorId]: '' }));
      fetchPendingDoctors();
    } catch (error) {
      console.error('Error rejecting doctor:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  const viewDocument = async (filename) => {
    try {
      const response = await fetch(`${apiUrl}/api/admin/verification-document/${filename}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch document');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      setMessage('Failed to load the document.');
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>

      {message && <div className="admin-message">{message}</div>}

      <section className="admin-section">
        <h3>Pending Doctor Verifications ({pendingDoctors.length})</h3>

        {pendingDoctors.length === 0 ? (
          <p className="admin-empty">No pending verifications at this time.</p>
        ) : (
          <div className="admin-cards">
            {pendingDoctors.map((doctor) => {
              const v = doctor.verification;
              const isLoading = actionLoading[doctor.id];
              return (
                <div key={doctor.id} className="admin-doctor-card surface-card">
                  <div className="admin-card-header">
                    <h4>{doctor.username}</h4>
                    <span className="admin-badge pending">Pending</span>
                  </div>

                  <div className="admin-card-body">
                    <p><strong>Email:</strong> {doctor.email || 'N/A'}</p>
                    {v && (
                      <>
                        <p><strong>License #:</strong> {v.licenseNumber}</p>
                        <p><strong>Institution:</strong> {v.institution}</p>
                        <p><strong>Specialization:</strong> {v.specialization}</p>
                        <p><strong>Submitted:</strong> {new Date(v.submittedAt).toLocaleDateString()}</p>
                        {v.documentPath && (
                          <button
                            className="admin-view-doc-btn"
                            onClick={() => viewDocument(v.documentPath)}
                          >
                            View Document
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="admin-card-actions">
                    <button
                      className="admin-approve-btn"
                      onClick={() => handleApprove(doctor.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Approve'}
                    </button>

                    <div className="admin-reject-group">
                      <input
                        type="text"
                        placeholder="Rejection reason..."
                        value={rejectReasons[doctor.id] || ''}
                        onChange={(e) =>
                          setRejectReasons((prev) => ({ ...prev, [doctor.id]: e.target.value }))
                        }
                      />
                      <button
                        className="admin-reject-btn"
                        onClick={() => handleReject(doctor.id)}
                        disabled={isLoading}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
