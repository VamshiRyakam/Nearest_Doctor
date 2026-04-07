const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/User');
const DoctorVerification = require('../models/DoctorVerification');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// GET /api/admin/pending-doctors - Get all doctors with pending verification
router.get('/admin/pending-doctors', protect, admin, async (req, res) => {
  try {
    const doctors = await User.findAll({
      where: { role: 'doctor', verificationStatus: 'pending' },
      attributes: { exclude: ['password'] },
      include: [{
        model: DoctorVerification,
        as: 'verification',
        attributes: ['id', 'licenseNumber', 'institution', 'specialization', 'documentPath', 'documentOriginalName', 'submittedAt'],
      }],
    });
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/all-doctors - Get all doctors with any verification status
router.get('/admin/all-doctors', protect, admin, async (req, res) => {
  try {
    const doctors = await User.findAll({
      where: { role: 'doctor' },
      attributes: { exclude: ['password'] },
      include: [{
        model: DoctorVerification,
        as: 'verification',
        attributes: ['id', 'licenseNumber', 'institution', 'specialization', 'documentPath', 'documentOriginalName', 'rejectionReason', 'submittedAt', 'reviewedAt'],
      }],
    });
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/approve-doctor/:id - Approve a doctor's verification
router.post('/admin/approve-doctor/:id', protect, admin, async (req, res) => {
  try {
    const doctor = await User.findByPk(req.params.id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    if (doctor.verificationStatus !== 'pending') {
      return res.status(400).json({ message: `Cannot approve. Current status is "${doctor.verificationStatus}".` });
    }

    doctor.verificationStatus = 'verified';
    await doctor.save();

    // Update the verification record with review metadata
    const verification = await DoctorVerification.findOne({ where: { userId: doctor.id } });
    if (verification) {
      verification.reviewedAt = new Date();
      verification.reviewedBy = req.user.id;
      verification.rejectionReason = null;
      await verification.save();
    }

    res.json({ message: `Dr. ${doctor.username} has been verified successfully.` });
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/reject-doctor/:id - Reject a doctor's verification
router.post('/admin/reject-doctor/:id', protect, admin, async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: 'A rejection reason is required.' });
  }

  try {
    const doctor = await User.findByPk(req.params.id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    if (doctor.verificationStatus !== 'pending') {
      return res.status(400).json({ message: `Cannot reject. Current status is "${doctor.verificationStatus}".` });
    }

    doctor.verificationStatus = 'rejected';
    await doctor.save();

    // Update the verification record with rejection reason
    const verification = await DoctorVerification.findOne({ where: { userId: doctor.id } });
    if (verification) {
      verification.rejectionReason = reason;
      verification.reviewedAt = new Date();
      verification.reviewedBy = req.user.id;
      await verification.save();
    }

    res.json({ message: `Dr. ${doctor.username} has been rejected.`, reason });
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve uploaded verification documents to admin
router.get('/admin/verification-document/:filename', protect, admin, (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', 'verification', req.params.filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ message: 'Document not found.' });
    }
  });
});

// PUT /api/admin/users/:id/role - Change a user's role by admin
router.put('/admin/users/:id/role', protect, admin, async (req, res) => {
  const { role } = req.body;
  const userId = req.params.id;

  if (!role || !['patient', 'doctor', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be "patient", "doctor", or "admin".' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    if (role === 'doctor') {
      user.verificationStatus = 'unverified';
    } else {
      user.verificationStatus = 'none';
    }
    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      verificationStatus: updatedUser.verificationStatus,
      message: `User ${updatedUser.username}'s role updated to ${updatedUser.role}`,
    });
  } catch (error) {
    console.error('Error updating user role by admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
