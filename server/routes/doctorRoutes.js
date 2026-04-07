const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DoctorVerification = require('../models/DoctorVerification');
const { Op } = require('sequelize');

// GET /api/doctors?q=searchTerm
// Searches verified doctors by name, username, area, specialization, institution
router.get('/doctors', async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ message: 'Search query is required.' });
  }

  const search = q.trim();

  try {
    // First find verifications matching specialization or institution
    const matchingVerifications = await DoctorVerification.findAll({
      where: {
        [Op.or]: [
          { specialization: { [Op.iLike]: `%${search}%` } },
          { institution: { [Op.iLike]: `%${search}%` } },
        ],
      },
      attributes: ['userId', 'specialization', 'institution'],
    });
    const verMatchedUserIds = matchingVerifications.map((v) => v.userId);

    // Search users by name/area OR matching verification userId
    const userConditions = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { username: { [Op.iLike]: `%${search}%` } },
      { city: { [Op.iLike]: `%${search}%` } },
      { state: { [Op.iLike]: `%${search}%` } },
      { country: { [Op.iLike]: `%${search}%` } },
      { streetAddress: { [Op.iLike]: `%${search}%` } },
      { zipCode: { [Op.iLike]: `%${search}%` } },
      { formattedAddress: { [Op.iLike]: `%${search}%` } },
      { address: { [Op.iLike]: `%${search}%` } },
    ];
    if (verMatchedUserIds.length > 0) {
      userConditions.push({ id: { [Op.in]: verMatchedUserIds } });
    }

    const doctors = await User.findAll({
      where: {
        role: 'doctor',
        verificationStatus: 'verified',
        [Op.or]: userConditions,
      },
      attributes: ['id', 'username', 'fullName', 'profileImage', 'phone', 'country', 'streetAddress', 'aptSuiteUnit', 'city', 'state', 'zipCode', 'address', 'formattedAddress', 'addressVerified'],
      order: [['fullName', 'ASC']],
      limit: 20,
    });

    // Fetch verifications for all found doctors
    const doctorIds = doctors.map((d) => d.id);
    const allVerifications = await DoctorVerification.findAll({
      where: { userId: { [Op.in]: doctorIds } },
      attributes: ['userId', 'specialization', 'institution'],
    });
    const verMap = {};
    allVerifications.forEach((v) => { verMap[v.userId] = v; });

    const results = doctors.map((d) => {
      const doc = d.toJSON();
      const ver = verMap[d.id];
      const parts = [doc.streetAddress, doc.aptSuiteUnit, doc.city, doc.state, doc.zipCode, doc.country].filter(Boolean);
      return {
        id: doc.id,
        name: doc.username || doc.fullName,
        profileImage: doc.profileImage,
        phone: doc.phone,
        specialization: ver?.specialization || 'General',
        institution: ver?.institution || '',
        address: doc.formattedAddress || (parts.length > 0 ? parts.join(', ') : (doc.address || 'Not provided')),
        addressVerified: doc.addressVerified || false,
        city: doc.city || '',
        state: doc.state || '',
        country: doc.country || '',
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
