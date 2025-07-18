import express from 'express';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Book appointment (patient only)
router.post('/', auth, authorize('patient'), async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      type,
      symptoms,
      isUrgent
    } = req.body;

    // Check if doctor exists and is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (!doctor.isAvailable) {
      return res.status(400).json({ message: 'Doctor is not available' });
    }

    // Check if time slot is available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate,
      appointmentTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot is not available' });
    }

    const appointment = new Appointment({
      patientId: req.user.userId,
      doctorId,
      appointmentDate,
      appointmentTime,
      type,
      symptoms,
      isUrgent,
      consultationFee: doctor.consultationFee
    });

    await appointment.save();

    // Populate doctor and patient info
    await appointment.populate([
      { path: 'doctorId', populate: { path: 'userId', select: 'name email phone' } },
      { path: 'patientId', select: 'name email phone' }
    ]);

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient's appointments (patient only)
router.get('/my-appointments', auth, authorize('patient'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = { patientId: req.user.userId };
    
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name email phone profileImage'
        }
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: -1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark appointment as complete (doctor only)
router.put('/:id/complete', auth, authorize('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    // Find the doctor profile for the logged-in user
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment cannot be marked as complete' });
    }
    appointment.status = 'completed';
    // Ensure paymentStatus is set to 'paid' when completing
    if (appointment.paymentStatus !== 'paid') {
      appointment.paymentStatus = 'paid';
    }
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name email phone profileImage'
        }
      });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    const user = await User.findById(req.user.userId);
    if (user.role === 'patient' && appointment.patientId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.userId });
      if (appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel appointment (patient only)
router.put('/:id/cancel', auth, authorize('patient'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({ message: 'Appointment cannot be cancelled' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all appointments (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, doctorId, patientId, date } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (doctorId) {
      query.doctorId = doctorId;
    }
    
    if (patientId) {
      query.patientId = patientId;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: -1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointment statistics (admin only)
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      monthlyAppointments,
      urgentAppointments
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({
        appointmentDate: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      Appointment.countDocuments({ isUrgent: true })
    ]);

    res.json({
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      monthlyAppointments,
      urgentAppointments
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 