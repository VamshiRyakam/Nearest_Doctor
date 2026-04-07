const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const DoctorVerification = require('../models/DoctorVerification');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'verification');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config — only allow PDF, JPG, PNG up to 5MB
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper to generate a fresh JWT
const generateToken = (id, role, verificationStatus) => {
  return jwt.sign({ id, role, verificationStatus }, process.env.JWT_SECRET || 'supersecretjwtkey', {
    expiresIn: '1h',
  });
};

// @desc    Submit doctor verification form
// @route   POST /api/verification/submit
// @access  Private (doctors only)
router.post('/submit', protect, (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can submit verification.' });
    }

    if (user.verificationStatus === 'verified') {
      return res.status(400).json({ message: 'You are already verified.' });
    }

    if (user.verificationStatus === 'pending') {
      return res.status(400).json({ message: 'You already have a pending verification. Please wait for admin review.' });
    }

    const { licenseNumber, institution, specialization } = req.body;
    if (!licenseNumber || !institution || !specialization) {
      return res.status(400).json({ message: 'License number, institution, and specialization are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A verification document (PDF, JPG, or PNG) is required.' });
    }

    // Delete any previous rejected verification record so they can re-submit
    await DoctorVerification.destroy({ where: { userId: user.id } });

    // Create verification record
    const verification = await DoctorVerification.create({
      userId: user.id,
      licenseNumber,
      institution,
      specialization,
      documentPath: req.file.filename,
      documentOriginalName: req.file.originalname,
    });

    // Update user status to pending
    user.verificationStatus = 'pending';
    await user.save();

    // Return fresh token with updated verificationStatus
    const newToken = generateToken(user.id, user.role, user.verificationStatus);

    res.status(201).json({
      message: 'Verification submitted successfully. Please wait for admin approval.',
      verificationStatus: user.verificationStatus,
      token: newToken,
      verification: {
        id: verification.id,
        licenseNumber: verification.licenseNumber,
        institution: verification.institution,
        specialization: verification.specialization,
        submittedAt: verification.submittedAt,
      },
    });
  } catch (error) {
    console.error('Error submitting verification:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get current user's verification status and details
// @route   GET /api/verification/status
// @access  Private (doctors only)
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'role', 'verificationStatus'],
    });

    if (!user || user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors have verification status.' });
    }

    const verification = await DoctorVerification.findOne({
      where: { userId: user.id },
      attributes: ['id', 'licenseNumber', 'institution', 'specialization', 'rejectionReason', 'submittedAt', 'reviewedAt'],
    });

    res.json({
      verificationStatus: user.verificationStatus,
      verification: verification || null,
    });
  } catch (error) {
    console.error('Error fetching verification status:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
