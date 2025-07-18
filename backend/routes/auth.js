import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, specialty, licenseNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // If registering as doctor, create doctor profile
    if (role === 'doctor') {
      console.log('👨‍⚕️ Creating doctor profile for:', email);
      
      // Generate a default license number if not provided
      const defaultLicenseNumber = licenseNumber || `DOC${Date.now()}`;
      
      const doctor = new Doctor({
        userId: user._id,
        specialty: specialty || 'General Medicine',
        licenseNumber: defaultLicenseNumber,
        isVerified: false, // Doctors start as unverified
        isAvailable: false, // Start as unavailable until verified
        consultationFee: Number(req.body.consultationFee) || 0 // Set consultation fee from request body or default to 0
      });
      
      await doctor.save();
      console.log('✅ Doctor profile created with ID:', doctor._id);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Different response for doctors
    if (role === 'doctor') {
      res.status(201).json({
        message: 'Registration successful! Your account is pending admin verification. You will be notified once approved.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: false
        },
        requiresVerification: true
      });
    } else {
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.password) {
      // Defensive: user record is corrupted
      return res.status(500).json({ message: 'User account is corrupted. Please contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if doctor is verified
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        return res.status(403).json({ 
          message: 'Doctor profile not found. Please contact administrator.',
          requiresVerification: true
        });
      }
      if (!doctor.isVerified) {
        return res.status(403).json({ 
          message: 'Your account is pending admin verification. Please wait for approval.',
          requiresVerification: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: false
          }
        });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      address: user.address,
      profileImage: user.profileImage,
      lastLogin: user.lastLogin
    };

    // If doctor, include doctor profile
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor) {
        userData.doctorProfile = doctor;
      }
    }

    res.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send email with reset link
    // For now, just return the token
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user || user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 