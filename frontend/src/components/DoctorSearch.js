import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const DoctorSearch = () => {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingDetails, setBookingDetails] = useState('');
  const [bookingStatus, setBookingStatus] = useState({ state: 'idle', message: '' });
  const [bookingByDoctorId, setBookingByDoctorId] = useState({});

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch(`${apiUrl}/api/doctors?q=${encodeURIComponent(query.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch doctors.');
      }
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error(error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = (doctor) => {
    setBookingDoctor(doctor);
    setBookingDetails('');
    setBookingStatus({ state: 'idle', message: '' });
  };

  const closeBookingModal = () => {
    setBookingDoctor(null);
    setBookingDetails('');
    setBookingStatus({ state: 'idle', message: '' });
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingDoctor || !token) return;

    setBookingStatus({ state: 'loading', message: '' });
    setBookingByDoctorId({ ...bookingByDoctorId, [bookingDoctor.id]: true });

    try {
      const response = await fetch(`${apiUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: bookingDoctor.id,
          diagnosis: bookingDetails.trim() || null,
          remedy: null,
          severityLevel: null,
          consultationDoctor: null,
          symptomSummary: bookingDetails.trim() || null,
          chatHistory: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Booking failed');
      }

      setBookingStatus({ state: 'success', message: `Appointment request sent to ${bookingDoctor.name}!` });
      setTimeout(() => closeBookingModal(), 2000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setBookingStatus({ state: 'error', message: error.message || 'Unable to send appointment request. Please try again.' });
    } finally {
      setBookingByDoctorId({ ...bookingByDoctorId, [bookingDoctor.id]: false });
    }
  };

  return (
    <div className="doctor-search-container">
      <h2>Find Doctors</h2>
      <p className="doctor-search-hint">Search by name, area, specialization, or institution</p>
      <form onSubmit={handleSearch} className="doctor-search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Cardiologist, Apollo Hospital, Hyderabad..."
          className="doctor-search-input"
        />
        <button type="submit" className="doctor-search-btn" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="doctor-list">
        {doctors.length > 0 ? (
          doctors.map((doctor) => (
            <div key={doctor.id} className="doctor-card surface-card">
              <div className="doctor-card-header">
                {doctor.profileImage ? (
                  <img
                    src={`/images/${doctor.profileImage}`}
                    alt={doctor.name}
                    className="doctor-card-avatar"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable="false"
                  />
                ) : (
                  <div className="doctor-card-avatar-placeholder">
                    {(doctor.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="doctor-card-info">
                  <h3>{doctor.name}</h3>
                  <span className="doctor-card-specialization">{doctor.specialization}</span>
                </div>
              </div>
              <div className="doctor-card-details">
                {doctor.institution && (
                  <p><strong>Institution:</strong> {doctor.institution}</p>
                )}
                <p><strong>Address:</strong> {doctor.address}</p>
                {doctor.phone && (
                  <p><strong>Phone:</strong> {doctor.phone}</p>
                )}
              </div>
              <button
                className="book-appointment-btn"
                onClick={() => openBookingModal(doctor)}
                disabled={bookingByDoctorId[doctor.id]}
              >
                {bookingByDoctorId[doctor.id] ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          ))
        ) : (
          searched && !loading && <p className="doctor-search-empty">No doctors found matching "{query}".</p>
        )}
      </div>

      {bookingDoctor && (
        <div className="modal-overlay" onClick={closeBookingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book Appointment with {bookingDoctor.name}</h3>
              <button className="modal-close" onClick={closeBookingModal}>×</button>
            </div>
            <form onSubmit={handleBookAppointment} className="booking-form">
              <div className="form-group">
                <label>Specialization: {bookingDoctor.specialization}</label>
              </div>
              {bookingDoctor.institution && (
                <div className="form-group">
                  <label>Institution: {bookingDoctor.institution}</label>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="symptoms">Reason for Appointment (Optional)</label>
                <textarea
                  id="symptoms"
                  value={bookingDetails}
                  onChange={(e) => setBookingDetails(e.target.value)}
                  placeholder="Describe your symptoms or reason for visiting..."
                  className="booking-textarea"
                  rows="4"
                />
              </div>
              {bookingStatus.state === 'success' && (
                <p className="booking-status success">{bookingStatus.message}</p>
              )}
              {bookingStatus.state === 'error' && (
                <p className="booking-status error">{bookingStatus.message}</p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeBookingModal}
                  disabled={bookingStatus.state === 'loading'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={bookingStatus.state === 'loading'}
                >
                  {bookingStatus.state === 'loading' ? 'Sending...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;
