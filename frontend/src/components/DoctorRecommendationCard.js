import React from 'react';

const DoctorRecommendationCard = ({ doctor, onBook, bookingState }) => {
  if (!doctor) return null;
  const isLoading = bookingState?.state === 'loading';
  return (
    <div className="doctor-recommendation-card">
      <div className="doctor-recommendation-heading">Doctor Recommendation</div>
      <h4 className="doctor-name">{doctor.name}</h4>
      <p><span>Specialization:</span> {doctor.specialization}</p>
      {doctor.institution && <p><span>Institution:</span> {doctor.institution}</p>}
      <p><span>Address:</span> {doctor.address}</p>
      {doctor.phone && <p><span>Phone:</span> {doctor.phone}</p>}
      <button
        className="book-appointment-btn"
        onClick={() => !isLoading && onBook && onBook(doctor)}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Book Appointment'}
      </button>
      {bookingState?.state === 'success' && (
        <p className="booking-status success">{bookingState.message}</p>
      )}
      {bookingState?.state === 'error' && (
        <p className="booking-status error">{bookingState.message}</p>
      )}
    </div>
  );
};

export default DoctorRecommendationCard;
