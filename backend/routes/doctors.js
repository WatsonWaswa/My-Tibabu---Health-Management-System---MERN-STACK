import express from 'express';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all doctors (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, specialty, search, available } = req.query;
    
    let query = { isVerified: true }; // Only return verified doctors
    
    if (specialty) {
      query.specialty = { $regex: specialty, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { specialty: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (available === 'true') {
      query.isAvailable = true;
    }

    const doctors = await Doctor.find(query)
      .populate('userId', 'name email phone profileImage')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });

    const total = await Doctor.countDocuments(query);

    res.json({
      doctors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor profile (doctor only) - MUST come before /:id route
router.get('/profile/me', auth, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.userId })
      .populate('userId', 'name email phone profileImage');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's appointments (doctor only) - MUST come before /:id route
router.get('/appointments/me', auth, authorize('doctor'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    
    console.log('📅 Getting appointments for doctor user:', req.user.userId);
    
    // First get the doctor's profile to get the doctor ID
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      console.log('❌ Doctor profile not found for user:', req.user.userId);
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    
    console.log('✅ Found doctor profile:', doctor._id);
    
    let query = { doctorId: doctor._id };
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    console.log('🔍 Query for appointments:', query);

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: 1 });

    const total = await Appointment.countDocuments(query);

    console.log(`📋 Found ${appointments.length} appointments out of ${total} total`);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('❌ Error getting doctor appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor statistics (doctor only) - MUST come before /:id route
router.get('/stats/me', auth, authorize('doctor'), async (req, res) => {
  try {
    console.log('📊 Getting stats for doctor user:', req.user.userId);
    
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      console.log('❌ Doctor profile not found for user:', req.user.userId);
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    console.log('✅ Found doctor profile:', doctor._id);

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      monthlyAppointments,
      totalPatients
    ] = await Promise.all([
      Appointment.countDocuments({ doctorId: doctor._id }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'completed' }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'pending' }),
      Appointment.countDocuments({
        doctorId: doctor._id,
        appointmentDate: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      Appointment.distinct('patientId', { doctorId: doctor._id })
    ]);

    console.log('📈 Doctor stats:', {
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      monthlyAppointments,
      totalPatients: totalPatients.length
    });

    res.json({
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      monthlyAppointments,
      totalPatients: totalPatients.length,
      rating: doctor.rating
    });
  } catch (error) {
    console.error('❌ Error getting doctor stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor by ID - MUST come after specific routes
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email phone profileImage dateOfBirth gender address');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update doctor profile (doctor only)
router.put('/profile/me', auth, authorize('doctor'), async (req, res) => {
  try {
    const {
      specialty,
      experience,
      education,
      certifications,
      languages,
      consultationFee,
      availability,
      bio,
      isAvailable
    } = req.body;
    
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    doctor.specialty = specialty || doctor.specialty;
    doctor.experience = experience || doctor.experience;
    doctor.education = education || doctor.education;
    doctor.certifications = certifications || doctor.certifications;
    doctor.languages = languages || doctor.languages;
    doctor.consultationFee = consultationFee || doctor.consultationFee;
    doctor.availability = availability || doctor.availability;
    doctor.bio = bio || doctor.bio;
    doctor.isAvailable = isAvailable !== undefined ? isAvailable : doctor.isAvailable;

    await doctor.save();
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status (doctor only)
router.put('/appointments/:id/status', auth, authorize('doctor'), async (req, res) => {
  try {
    const { status, diagnosis, prescription, notes } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Verify doctor owns this appointment
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = status || appointment.status;
    appointment.diagnosis = diagnosis || appointment.diagnosis;
    appointment.prescription = prescription || appointment.prescription;
    appointment.notes = notes || appointment.notes;

    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 