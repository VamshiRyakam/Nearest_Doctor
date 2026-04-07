const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
router.put('/me', protect, async (req, res) => {
  const { username, password, fullName, age, phone, address, bloodGroup, profileImage, country, streetAddress, aptSuiteUnit, city, state, zipCode, latitude, longitude, formattedAddress, addressVerified } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update username if provided and changed
    if (username && username !== user.username) {
      const userExists = await User.findOne({ where: { username } });
      if (userExists) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      user.username = username;
    }

    // Update password if provided
    if (password) {
      user.password = password; // beforeUpdate hook will hash it
    }

    // Update profile fields
    if (fullName !== undefined) user.fullName = fullName;
    if (age !== undefined) user.age = age;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (country !== undefined) user.country = country;
    if (streetAddress !== undefined) user.streetAddress = streetAddress;
    if (aptSuiteUnit !== undefined) user.aptSuiteUnit = aptSuiteUnit;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (zipCode !== undefined) user.zipCode = zipCode;
    if (latitude !== undefined) user.latitude = (latitude === '' || latitude === null) ? null : parseFloat(latitude);
    if (longitude !== undefined) user.longitude = (longitude === '' || longitude === null) ? null : parseFloat(longitude);
    if (formattedAddress !== undefined) user.formattedAddress = formattedAddress || null;
    if (addressVerified !== undefined) user.addressVerified = addressVerified;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;
    res.json(updatedUser);

  } catch (error) {
    console.error('Error updating user profile:', error.message);
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Update user role (one-time, for unassigned users only)
// @route   PUT /api/users/me/role
// @access  Private
router.put('/me/role', protect, async (req, res) => {
  const { role } = req.body;
  const jwt = require('jsonwebtoken');

  if (!role || (role !== 'patient' && role !== 'doctor')) {
    return res.status(400).json({ message: 'Invalid role. Must be "patient" or "doctor".' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'unassigned') {
      return res.status(403).json({ message: 'Role has already been assigned.' });
    }

    user.role = role;
    // Doctors start as unverified; patients don't need verification
    user.verificationStatus = (role === 'doctor') ? 'unverified' : 'none';
    await user.save();

    // Return a fresh JWT with the updated role and verificationStatus
    const newToken = jwt.sign(
      { id: user.id, role: user.role, verificationStatus: user.verificationStatus },
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '1h' }
    );

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      verificationStatus: user.verificationStatus,
      token: newToken,
    });

  } catch (error) {
    console.error('Error updating user role:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

