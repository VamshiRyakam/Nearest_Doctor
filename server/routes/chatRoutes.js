const express = require('express');
const router = express.Router();
const axios = require('axios');
const { recommendDoctor } = require('../services/doctorRecommendation');
const { protect } = require('../middleware/authMiddleware');

const AI_SERVICE_URL = 'http://localhost:8000/analyze';

// POST /api/chat
router.post('/chat', protect, async (req, res) => {
  const { history } = req.body;

  if (!history || history.length === 0) {
    return res.status(400).json({ message: 'Chat history is required.' });
  }

  try {
    const response = await axios.post(AI_SERVICE_URL, { history });
    let aiData = response.data;

    const specialistType = aiData.specialist_type || aiData.consultation_doctor || 'General Medicine';
    aiData.consultation_doctor = specialistType; // keep UI compatibility

    // Emergency override: if severity is Critical, do not recommend doctor
    if (aiData.severity_level === 'Critical') {
      aiData.recommendedDoctor = null;
      aiData.emergency = true;
      return res.json(aiData);
    }

    // If AI returned a diagnosis with a specialist, recommend a doctor
    if (aiData.diagnosis && specialistType && req.user) {
      const doctor = await recommendDoctor(req.user, specialistType);
      if (doctor) {
        aiData.recommendedDoctor = doctor;
      }
    }
    res.json(aiData);
  } catch (error) {
    console.error('Error forwarding request to AI service:', error.message);
    res.status(502).json({ message: 'Error communicating with the AI service.' });
  }
});

module.exports = router;
