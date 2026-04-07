const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled', 'expired'),
    defaultValue: 'pending',
  },
  diagnosis: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  remedy: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  severityLevel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consultationDoctor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  symptomSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  chatHistory: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['patientId'] },
    { fields: ['doctorId'] },
    { fields: ['status'] },
    { fields: ['doctorId', 'status'] },
    { fields: ['patientId', 'status'] },
  ],
});

module.exports = Appointment;
