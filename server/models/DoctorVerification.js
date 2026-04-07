const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorVerification = sequelize.define('DoctorVerification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  institution: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  documentPath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  documentOriginalName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
});

module.exports = DoctorVerification;
