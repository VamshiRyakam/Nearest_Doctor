const { Op } = require('sequelize');
const User = require('../models/User');
const DoctorVerification = require('../models/DoctorVerification');

const allowedSpecialties = [
  'Cardiology',
  'Gastroenterology',
  'ENT',
  'Pulmonology',
  'Gynecology',
  'Urology',
  'General Medicine',
  'Neurology',
  'Neurosurgery',
  'Pediatrics',
  'Psychiatry',
  'Dermatology',
  'Oncology',
];

const normalizeSpecialization = (value) => {
  const raw = (value || '').toString().trim();
  if (!raw) return 'General Medicine';

  const lower = raw.toLowerCase();
  const aliasMap = {
    'general physician': 'General Medicine',
    'general practice': 'General Medicine',
    'general practitioner': 'General Medicine',
    'neuro surgon': 'Neurosurgery',
    'neuro surgeon': 'Neurosurgery',
    'neurosurgeon': 'Neurosurgery',
  };

  if (aliasMap[lower]) return aliasMap[lower];

  const exact = allowedSpecialties.find((s) => s.toLowerCase() === lower);
  return exact || 'General Medicine';
};

const buildAddress = (doctor) => {
  const parts = [
    doctor.streetAddress,
    doctor.aptSuiteUnit,
    doctor.city,
    doctor.state,
    doctor.zipCode,
    doctor.country,
  ].filter(Boolean);

  return doctor.formattedAddress || (parts.length > 0 ? parts.join(', ') : (doctor.address || 'Not provided'));
};

async function findDoctorBySpecialty(specialization) {
  return User.findOne({
    where: {
      role: 'doctor',
      verificationStatus: 'verified',
    },
    include: [
      {
        model: DoctorVerification,
        as: 'verification',
        required: true,
        attributes: ['specialization', 'institution'],
        where: { specialization: { [Op.iLike]: specialization } },
      },
    ],
    attributes: [
      'id',
      'username',
      'fullName',
      'profileImage',
      'phone',
      'country',
      'streetAddress',
      'aptSuiteUnit',
      'city',
      'state',
      'zipCode',
      'address',
      'formattedAddress',
      'addressVerified',
    ],
    order: [
      ['fullName', 'ASC'],
      ['username', 'ASC'],
    ],
  });
}

async function recommendDoctor(patientUser, specialistType) { // patientUser kept for future use
  try {
    const requested = normalizeSpecialization(specialistType);
    const searchOrder = requested === 'General Medicine' ? ['General Medicine'] : [requested, 'General Medicine'];

    for (const specialization of searchOrder) {
      const doctor = await findDoctorBySpecialty(specialization);
      if (doctor) {
        return {
          id: doctor.id,
          name: doctor.fullName || doctor.username,
          profileImage: doctor.profileImage,
          phone: doctor.phone,
          specialization: doctor.verification?.specialization || specialization,
          institution: doctor.verification?.institution || '',
          address: buildAddress(doctor),
          addressVerified: !!doctor.addressVerified,
          city: doctor.city || '',
          state: doctor.state || '',
          country: doctor.country || '',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error recommending doctor:', error.message);
    return null;
  }
}

module.exports = { recommendDoctor };
