import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';

const severityRank = {
  critical: 1,
  high: 2,
  moderate: 3,
  low: 4,
  unknown: 5,
};

const DoctorAppointments = ({ mode = 'active' }) => {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [statusFilter, setStatusFilter] = useState('all');
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const isCompletedView = mode === 'completed';

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    try {
      const query = isCompletedView ? '?status=completed' : '';
      const response = await fetch(`${apiUrl}/api/appointments/doctor${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load appointments');
      }
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, isCompletedView]);

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 20000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  const severityValue = (appt) => {
    const key = (appt.severityLevel || 'unknown').toLowerCase();
    return severityRank[key] || severityRank.unknown;
  };

  const filteredAppointments = useMemo(() => {
    let list = appointments || [];
    if (!isCompletedView) {
      list = list.filter((appt) => appt.status !== 'completed');
      if (statusFilter !== 'all') {
        list = list.filter((appt) => appt.status === statusFilter);
      }
    }
    if (isCompletedView) {
      list = list.filter((appt) => appt.status === 'completed');
    }

    const sorted = [...list];
    if (sortBy === 'severity') {
      sorted.sort((a, b) => severityValue(a) - severityValue(b));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return sorted;
  }, [appointments, sortBy, statusFilter, isCompletedView]);

  const groupedByPatient = useMemo(() => {
    return filteredAppointments.reduce((acc, appt) => {
      const key = appt.patient?.id || appt.patient?.email || appt.id;
      if (!acc[key]) {
        acc[key] = {
          patient: appt.patient,
          appointments: [],
        };
      }
      acc[key].appointments.push(appt);
    return acc;
    }, {});
  }, [filteredAppointments]);

  const getReminderMeta = (scheduledAt, status) => {
    if (!scheduledAt || status === 'completed') return null;
    const now = Date.now();
    const scheduled = new Date(scheduledAt).getTime();
    if (Number.isNaN(scheduled)) return null;
    const diffMs = scheduled - now;
    const minutes = Math.round(diffMs / 60000);

    if (diffMs >= 0 && diffMs <= 60 * 60000) {
      return { type: 'soon', text: `Reminder: starts in ${minutes} min` };
    }
    if (diffMs < 0 && Math.abs(diffMs) <= 30 * 60000) {
      return { type: 'ongoing', text: 'Reminder: appointment time is now' };
    }
    return null;
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      const response = await fetch(`${apiUrl}/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Unable to update appointment status.');
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to remove this completed appointment?')) return;
    try {
      const response = await fetch(`${apiUrl}/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Unable to delete appointment.');
    }
  };

  const handleScheduleAppointment = async (appointmentId) => {
    const localValue = scheduleDrafts[appointmentId];
    if (!localValue) {
      alert('Please pick date and time first.');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/appointments/${appointmentId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ scheduledAt: new Date(localValue).toISOString() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to schedule appointment');
      }

      fetchAppointments();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      alert(error.message || 'Unable to schedule appointment.');
    }
  };

  const renderSkeleton = () => (
    <div className="appointment-skeleton-grid">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="appointment-card skeleton">
          <div className="skeleton-line skeleton-w60" />
          <div className="skeleton-line skeleton-w40" />
          <div className="skeleton-line skeleton-w80" />
        </div>
      ))}
    </div>
  );

  const groups = Object.values(groupedByPatient);
  const title = isCompletedView ? 'Completed Appointments' : 'Active Appointments';
  const subtitle = isCompletedView ? 'History of completed sessions' : 'Pending and upcoming requests';

  return (
    <section className="doctor-appointments">
      <div className="appointments-header">
        <div>
          <p className="section-eyebrow">{subtitle}</p>
          <h3>{title}</h3>
        </div>
        <div className="appointments-filters">
          {!isCompletedView && (
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Approved</option>
            </select>
          )}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">Latest first</option>
            <option value="severity">Severity (high → low)</option>
          </select>
          <button className="pill-button secondary" onClick={fetchAppointments}>Refresh</button>
        </div>
      </div>

      {loading && renderSkeleton()}

      {!loading && groups.length === 0 && (
        <div className="empty-state-card">
          <p>No appointments found.</p>
          <span>They will appear here as soon as patients request them.</span>
        </div>
      )}

      {!loading && groups.map((group) => (
        <div key={group.patient?.id || Math.random()} className="patient-appointment-group">
          <div className="patient-group-header">
            <div className="patient-avatar">
              {(group.patient?.fullName || group.patient?.username || 'P')[0]}
            </div>
            <div>
              <h4>{group.patient?.fullName || group.patient?.username || 'Patient'}</h4>
              <p>{group.patient?.email} · {group.patient?.phone || 'No phone'}</p>
            </div>
          </div>
          <div className="patient-appointments-grid">
            {group.appointments.map((appt) => (
              <div key={appt.id} className="appointment-card">
                <div className="appointment-card-header">
                  <span className={`status-pill ${appt.status}`}>{appt.status}</span>
                  <span className={`severity-chip severity-${(appt.severityLevel || 'unknown').toLowerCase()}`}>
                    {appt.severityLevel || 'Unknown'}
                  </span>
                </div>
                <p className="appointment-diagnosis">{appt.diagnosis || 'Diagnosis not provided'}</p>
                <p className="appointment-meta">Requested {new Date(appt.createdAt).toLocaleString()}</p>
                <p className="appointment-meta">
                  Scheduled: {appt.scheduledAt ? new Date(appt.scheduledAt).toLocaleString() : 'Not set'}
                </p>
                {getReminderMeta(appt.scheduledAt, appt.status) && (
                  <p className={`appointment-reminder ${getReminderMeta(appt.scheduledAt, appt.status).type}`}>
                    {getReminderMeta(appt.scheduledAt, appt.status).text}
                  </p>
                )}
                {appt.symptomSummary && (
                  <div className="appointment-notes">
                    <strong>Patient notes</strong>
                    <p>{appt.symptomSummary}</p>
                  </div>
                )}
                <div className="appointment-actions">
                  {appt.status !== 'completed' && (
                    <>
                      <input
                        type="datetime-local"
                        value={scheduleDrafts[appt.id] || ''}
                        onChange={(e) => setScheduleDrafts((prev) => ({ ...prev, [appt.id]: e.target.value }))}
                        className="appointment-datetime-input"
                      />
                      <button onClick={() => handleScheduleAppointment(appt.id)} className="pill-button secondary">
                        Set time
                      </button>
                    </>
                  )}
                  {appt.status === 'pending' && (
                    <button onClick={() => handleUpdateStatus(appt.id, 'confirmed')} className="pill-button primary">Approve</button>
                  )}
                  {appt.status === 'confirmed' && (
                    <button onClick={() => handleUpdateStatus(appt.id, 'completed')} className="pill-button primary">Mark completed</button>
                  )}
                  {isCompletedView && (
                    <button onClick={() => handleDelete(appt.id)} className="pill-button danger">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

export default DoctorAppointments;
