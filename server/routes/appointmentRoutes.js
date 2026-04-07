const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const DoctorVerification = require('../models/DoctorVerification');
const { Op } = require('sequelize');

// POST /api/appointments - create a booking from patient to doctor
router.post('/appointments', protect, async (req, res) => {
  const {
    doctorId,
    diagnosis,
    remedy,
    severityLevel,
    consultationDoctor,
    symptomSummary,
    chatHistory,
  } = req.body;

  if (!doctorId) {
    return res.status(400).json({ message: 'Doctor ID is required.' });
  }

  if (req.user.role !== 'patient' && req.user.role !== 'unassigned') {
    return res.status(403).json({ message: 'Only patients can book appointments.' });
  }

  try {
    const doctor = await User.findByPk(doctorId);
    if (!doctor || doctor.role !== 'doctor' || doctor.verificationStatus !== 'verified') {
      return res.status(400).json({ message: 'Selected doctor is not available for bookings.' });
    }

    const normalizedDiagnosis = diagnosis?.slice(0, 255) || null;
    const duplicateWhere = {
      patientId: req.user.id,
      doctorId,
      status: { [Op.in]: ['pending', 'confirmed'] },
    };
    if (normalizedDiagnosis) {
      duplicateWhere.diagnosis = normalizedDiagnosis;
    } else {
      duplicateWhere.diagnosis = { [Op.is]: null };
    }

    const existing = await Appointment.findOne({ where: duplicateWhere });
    if (existing) {
      return res.status(409).json({ message: 'You already have an active appointment with this doctor for this concern.' });
    }

    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId,
      diagnosis: normalizedDiagnosis,
      remedy: remedy || null,
      severityLevel: severityLevel || null,
      consultationDoctor: consultationDoctor || null,
      symptomSummary: symptomSummary || null,
      chatHistory: chatHistory || null,
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/appointments/patient - list appointments for patient
router.get('/appointments/patient', protect, async (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ message: 'Only patients can view their appointments.' });
  }

  try {
    const appointments = await Appointment.findAll({
      where: { patientId: req.user.id },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'fullName', 'username', 'email', 'phone', 'profileImage', 'city', 'state', 'country', 'formattedAddress'],
          include: [
            {
              model: DoctorVerification,
              as: 'verification',
              attributes: ['specialization', 'institution'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching patient appointments:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/appointments/doctor - list appointments for doctor
router.get('/appointments/doctor', protect, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can view their appointments.' });
  }

  const { status } = req.query;

  try {
    const where = { doctorId: req.user.id };
    if (status) {
      where.status = status;
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'username', 'fullName', 'email', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/appointments/:id/status - doctor updates appointment status
router.put('/appointments/:id/status', protect, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can update appointments.' });
  }

  const { status, scheduledAt } = req.body;
  const allowed = ['pending', 'confirmed', 'completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    const appointment = await Appointment.findOne({ where: { id: req.params.id, doctorId: req.user.id } });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const updatePayload = { status };
    if (scheduledAt !== undefined) {
      updatePayload.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }

    await appointment.update(updatePayload);
    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment status:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/appointments/:id/schedule - doctor sets date/time for appointment
router.put('/appointments/:id/schedule', protect, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can schedule appointments.' });
  }

  const { scheduledAt } = req.body;
  if (!scheduledAt) {
    return res.status(400).json({ message: 'scheduledAt is required.' });
  }

  const parsedDate = new Date(scheduledAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid scheduledAt value.' });
  }

  try {
    const appointment = await Appointment.findOne({ where: { id: req.params.id, doctorId: req.user.id } });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    appointment.scheduledAt = parsedDate;
    if (appointment.status === 'pending') {
      appointment.status = 'confirmed';
    }
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    console.error('Error scheduling appointment:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/appointments/:id - doctor deletes completed appointment
router.delete('/appointments/:id', protect, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can delete appointments.' });
  }

  try {
    const appointment = await Appointment.findOne({ where: { id: req.params.id, doctorId: req.user.id } });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed appointments can be deleted.' });
    }

    await appointment.destroy();
    res.json({ message: 'Appointment removed.' });
  } catch (error) {
    console.error('Error deleting appointment:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
