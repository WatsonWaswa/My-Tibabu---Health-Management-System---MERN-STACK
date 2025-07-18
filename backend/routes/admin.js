import express from 'express';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Message from '../models/Message.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      monthlyAppointments,
      pendingAppointments,
      completedAppointments,
      totalRevenue,
      monthlyRevenue,
      pendingRevenue,
      completedRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({
        appointmentDate: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
      ]),
      Appointment.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            appointmentDate: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
      ]),
      Appointment.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
      ]),
      Appointment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
      ])
    ]);

    res.json({
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      monthlyAppointments,
      pendingAppointments,
      completedAppointments,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      pendingRevenue: pendingRevenue[0]?.total || 0,
      completedRevenue: completedRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics by role
router.get('/stats/users', auth, authorize('admin'), async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    res.json(userStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointment statistics by status
router.get('/stats/appointments', auth, authorize('admin'), async (req, res) => {
  try {
    const appointmentStats = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(appointmentStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue statistics
router.get('/stats/revenue', auth, authorize('admin'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let dateFilter = {};

    if (period === 'month') {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      dateFilter = { appointmentDate: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (period === 'year') {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      dateFilter = { appointmentDate: { $gte: startOfYear, $lte: endOfYear } };
    }

    const revenueStats = await Appointment.aggregate([
      { $match: { ...dateFilter, paymentStatus: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            month: { $month: '$appointmentDate' }
          },
          revenue: { $sum: '$consultationFee' },
          appointments: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json(revenueStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor performance statistics
router.get('/stats/doctors', auth, authorize('admin'), async (req, res) => {
  try {
    const doctorStats = await Doctor.aggregate([
      {
        $lookup: {
          from: 'appointments',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'appointments'
        }
      },
      {
        $project: {
          name: '$userId',
          specialty: 1,
          totalAppointments: { $size: '$appointments' },
          completedAppointments: {
            $size: {
              $filter: {
                input: '$appointments',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          rating: 1,
          isAvailable: 1
        }
      },
      { $sort: { totalAppointments: -1 } },
      { $limit: 10 }
    ]);

    // Populate doctor names
    const populatedStats = await Promise.all(
      doctorStats.map(async (stat) => {
        const user = await User.findById(stat.name).select('name email');
        return {
          ...stat,
          doctorName: user?.name || 'Unknown',
          doctorEmail: user?.email || 'Unknown'
        };
      })
    );

    res.json(populatedStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending doctors for verification
router.get('/doctors/pending', auth, authorize('admin'), async (req, res) => {
  try {
    console.log('🔍 Fetching pending doctors...');
    
    const pendingDoctors = await Doctor.find({ isVerified: false })
      .populate('userId', 'name email phone createdAt')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${pendingDoctors.length} pending doctors`);
    
    res.json(pendingDoctors);
  } catch (error) {
    console.error('❌ Error fetching pending doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all doctors with verification status
router.get('/doctors', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, verified } = req.query;
    
    let query = {};
    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }

    const doctors = await Doctor.find(query)
      .populate('userId', 'name email phone createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

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

// Verify doctor (admin only)
router.put('/doctors/:id/verify', auth, authorize('admin'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isVerified = true;
    doctor.isAvailable = true; // Make doctor available after verification
    await doctor.save();

    res.json({
      message: 'Doctor verified successfully',
      doctor
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject doctor verification
router.put('/doctors/:id/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Delete the doctor profile and user
    await Doctor.findByIdAndDelete(req.params.id);
    await User.findByIdAndDelete(doctor.userId);

    res.json({
      message: 'Doctor registration rejected',
      reason: reason || 'Verification failed'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, isActive, phone } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.isActive = isActive !== undefined ? isActive : user.isActive;
    user.phone = phone || user.phone;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // If user is a doctor, also delete their doctor profile
    if (user.role === 'doctor') {
      await Doctor.findOneAndDelete({ userId: user._id });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all appointments (admin only)
router.get('/appointments', auth, authorize('admin'), async (req, res) => {
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

// Get system logs (placeholder for future implementation)
router.get('/logs', auth, authorize('admin'), async (req, res) => {
  try {
    // This would typically connect to a logging service
    // For now, return basic system info
    res.json({
      message: 'System logs endpoint - to be implemented with logging service',
      timestamp: new Date(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 