const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Generate JWT token
const generateToken = (id, role, verificationStatus) => {
  return jwt.sign({ id, role, verificationStatus }, process.env.JWT_SECRET || 'supersecretjwtkey', {
    expiresIn: '1h',
  });
};

const normalizeUsername = (value) => {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 24);
};

const buildUniqueUsername = async (preferredValue) => {
  const base = normalizeUsername(preferredValue) || 'user';
  let attempt = base;
  let suffix = 1;

  while (await User.findOne({ where: { username: { [Op.iLike]: attempt } } })) {
    attempt = `${base}${suffix}`.slice(0, 30);
    suffix += 1;
  }

  return attempt;
};

// POST /api/register - Register a new user
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  const trimmedUsername = (username || '').trim();
  const trimmedEmail = (email || '').trim().toLowerCase();

  // Only allow patient or doctor registration — admin is created manually
  const allowedRoles = ['patient', 'doctor'];
  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be "patient" or "doctor".' });
  }

  try {
    if (!trimmedUsername) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const userExists = await User.findOne({ where: { username: { [Op.iLike]: trimmedUsername } } });
    if (userExists) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    if (trimmedEmail) {
      const emailExists = await User.findOne({ where: { email: { [Op.iLike]: trimmedEmail } } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already registered.' });
      }
    }

    // Doctors start as unverified; patients don't need verification
    const verificationStatus = (role === 'doctor') ? 'unverified' : 'none';
    const user = await User.create({
      username: trimmedUsername,
      email: trimmedEmail || null,
      password,
      role: role || 'patient',
      verificationStatus,
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role,
      verificationStatus: user.verificationStatus,
      token: generateToken(user.id, user.role, user.verificationStatus),
    });
  } catch (error) {
    console.error('Error registering user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/login - Authenticate user and get token
router.post('/login', async (req, res) => {
  const { username, email, usernameOrEmail, password } = req.body;
  const identifier = (usernameOrEmail || username || email || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Username/email and password are required.' });
  }

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: { [Op.iLike]: identifier } },
          { email: { [Op.iLike]: identifier } },
        ],
      },
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        verificationStatus: user.verificationStatus,
        token: generateToken(user.id, user.role, user.verificationStatus),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error logging in user:', error.message);
    res.status(500).json({ message: 'Server error', error });
  }
});

const passport = require('passport');
const { OAuth2Client } = require('google-auth-library'); // Import OAuth2Client

// Initialize Google OAuth2 Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ... (existing code: generateToken, register, login)

// GET /api/auth/google - Initiate Google OAuth flow (remains for completeness)
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// POST /api/auth/google/callback - Handle Google ID Token from frontend
router.post('/auth/google/callback', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Google ID token is missing.' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ where: { email: payload.email } });

    if (user && !user.googleId) {
      user.googleId = payload.sub;
      await user.save();
    } else {
      user = await User.findOne({ where: { googleId: payload.sub } });
    }

    if (!user) {
      const preferredUsername = payload.email ? payload.email.split('@')[0] : payload.name;
      const uniqueUsername = await buildUniqueUsername(preferredUsername);

      // If user doesn't exist, create a new one
      user = await User.create({
        googleId: payload.sub,
        username: uniqueUsername,
        email: payload.email, // Use email for email
        password: null, // No password for Google authenticated users
        role: 'unassigned', // Set initial role to 'unassigned' for new Google users
      });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      verificationStatus: user.verificationStatus,
      token: generateToken(user.id, user.role, user.verificationStatus),
    });

  } catch (error) {
    console.error('Error verifying Google ID token or authenticating user:', error);
    res.status(500).json({ message: 'Google authentication failed.', error: error.message });
  }
});

module.exports = router;
