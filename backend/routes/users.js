import express from 'express';
import User from '../models/User.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, dateOfBirth, gender, address } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.gender = gender || user.gender;
    user.address = address || user.address;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
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

// Get users for messaging (authenticated users can access)
router.get('/messaging', auth, async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = { _id: { $ne: req.user.userId } }; // Exclude current user
    
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('name email role profileImage')
      .sort({ name: 1 });

    // If fetching doctors, include their specializations and filter by isVerified
    if (role === 'doctor' || !role) {
      const Doctor = (await import('../models/Doctor.js')).default;
      const usersWithSpecialties = [];
      for (const user of users) {
        if (user.role === 'doctor') {
          const doctorProfile = await Doctor.findOne({ userId: user._id, isVerified: true }).select('specialty consultationFee isAvailable isVerified');
          if (doctorProfile) {
            usersWithSpecialties.push({
              ...user.toObject(),
              specialty: doctorProfile.specialty || 'General Medicine',
              consultationFee: doctorProfile.consultationFee || 0,
              isAvailable: doctorProfile.isAvailable || false,
              isVerified: doctorProfile.isVerified || false
            });
          }
        } else {
          usersWithSpecialties.push(user.toObject());
        }
      }
      return res.json({
        users: usersWithSpecialties,
        total: usersWithSpecialties.length
      });
    } else {
      return res.json({
        users,
        total: users.length
      });
    }
  } catch (error) {
    console.error('Error fetching users for messaging:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (admin only)
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 