import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const severityRank = {
  critical: 1,
  high: 2,
  moderate: 3,
  low: 4,
  unknown: 5,
};

const PatientAppointments = () => {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const getReminderMeta = (scheduledAt, status) => {
    if (!scheduledAt || status === 'completed') return null;
    const now = Date.now();
    const scheduled = new Date(scheduledAt).getTime();
    if (Number.isNaN(scheduled)) return null;
    const diffMs = scheduled - now;
    const minutes = Math.round(diffMs / 60000);

    if (diffMs >= 0 && diffMs <= 60 * 60000) {
      return { type: 'soon', text: `Reminder: appointment starts in ${minutes} min` };
    }
    if (diffMs < 0 && Math.abs(diffMs) <= 30 * 60000) {
      return { type: 'ongoing', text: 'Reminder: appointment time is now' };
    }
    return null;
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/appointments/patient`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load appointments');
        }
        const data = await response.json();
        setAppointments(data);
        setError('');
      } catch (error) {
        console.error('Error fetching patient appointments:', error);
        setAppointments([]);
        setError('Unable to load appointments right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, [apiUrl, token]);

  const filtered = useMemo(() => {
    let list = appointments || [];
    if (statusFilter !== 'all') {
      list = list.filter((appt) => appt.status === statusFilter);
    }

    const sorted = [...list];
    if (sortBy === 'severity') {
      sorted.sort((a, b) => {
        const sevA = severityRank[(a.severityLevel || 'unknown').toLowerCase()] || severityRank.unknown;
        const sevB = severityRank[(b.severityLevel || 'unknown').toLowerCase()] || severityRank.unknown;
        return sevA - sevB;
      });
    } else {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return sorted;
  }, [appointments, statusFilter, sortBy]);

  if (user?.role !== 'patient') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="patient-appointments">
      <div className="appointments-header">
        <div>
          <p className="section-eyebrow">Your bookings</p>
          <h3>My Appointments</h3>
        </div>
        <div className="appointments-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Approved</option>
            <option value="completed">Completed</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">Latest first</option>
            <option value="severity">Severity (high → low)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="appointment-skeleton-grid">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="appointment-card skeleton">
              <div className="skeleton-line skeleton-w60" />
              <div className="skeleton-line skeleton-w40" />
              <div className="skeleton-line skeleton-w80" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state-card">
          <p>No appointments yet.</p>
          <span>Use the AI chat to request a consultation.</span>
        </div>
      )}

      {!loading && error && (
        <div className="empty-state-card">
          <p>{error}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="patient-appointments-grid">
          {filtered.map((appt) => (
            <div key={appt.id} className="appointment-card">
              <div className="appointment-card-header">
                <span className={`status-pill ${appt.status}`}>{appt.status}</span>
                <span className={`severity-chip severity-${(appt.severityLevel || 'unknown').toLowerCase()}`}>
                  {appt.severityLevel || 'Unknown'}
                </span>
              </div>
              <p className="appointment-diagnosis">{appt.diagnosis || 'Awaiting diagnosis'}</p>
              <p className="appointment-meta">Doctor: {appt.doctor?.fullName || appt.doctor?.username || 'Pending'}</p>
              <p className="appointment-meta">Requested {new Date(appt.createdAt).toLocaleString()}</p>
              <p className="appointment-meta">
                Scheduled: {appt.scheduledAt ? new Date(appt.scheduledAt).toLocaleString() : 'Doctor has not set time yet'}
              </p>
              {getReminderMeta(appt.scheduledAt, appt.status) && (
                <p className={`appointment-reminder ${getReminderMeta(appt.scheduledAt, appt.status).type}`}>
                  {getReminderMeta(appt.scheduledAt, appt.status).text}
                </p>
              )}
              {appt.symptomSummary && (
                <div className="appointment-notes">
                  <strong>Your notes</strong>
                  <p>{appt.symptomSummary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PatientAppointments;
