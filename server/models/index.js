const User = require('./User');
const DoctorVerification = require('./DoctorVerification');
const Appointment = require('./Appointment');

// Define Associations

// A User (doctor) has one DoctorVerification submission
User.hasOne(DoctorVerification, { foreignKey: 'userId', as: 'verification' });
DoctorVerification.belongsTo(User, { foreignKey: 'userId', as: 'doctor' });

// Appointments between patients and doctors
User.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });
User.hasMany(Appointment, { foreignKey: 'doctorId', as: 'doctorAppointments' });
Appointment.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

module.exports = {
  User,
  DoctorVerification,
  Appointment,
};
