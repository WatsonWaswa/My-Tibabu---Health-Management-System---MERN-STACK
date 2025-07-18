import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const router = express.Router();

// Send message (with file upload support)
router.post('/send', auth, upload.single('file'), async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text', appointmentId } = req.body;
    console.log('📨 Message send request:', { senderId: req.user.userId, receiverId, content });

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      console.log('❌ Receiver not found:', receiverId);
      return res.status(404).json({ message: 'Receiver not found' });
    }
    console.log('✅ Receiver found:', receiver.name);

    let fileUrl, fileName, fileSize, finalMessageType = messageType;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      // Determine type by mimetype
      if (req.file.mimetype.startsWith('image/')) {
        finalMessageType = 'image';
      } else {
        finalMessageType = 'file';
      }
    }

    const message = new Message({
      senderId: req.user.userId,
      receiverId,
      content,
      messageType: finalMessageType,
      fileUrl,
      fileName,
      fileSize,
      appointmentId
    });

    await message.save();
    console.log('💾 Message saved to database:', message._id);

    // Populate sender and receiver info
    await message.populate([
      { path: 'senderId', select: 'name email profileImage' },
      { path: 'receiverId', select: 'name email profileImage' }
    ]);

    // Emit real-time message to both sender and receiver
    const io = req.app.get('io');
    if (io) {
      // Create conversation ID (sorted user IDs to ensure consistency)
      const conversationId = [req.user.userId, receiverId].sort().join('-');
      console.log('📡 Emitting message to conversation:', conversationId);
      
      // Emit to the conversation room
      io.to(conversationId).emit('message-received', {
        message: message,
        conversationId: conversationId
      });
      
      // Also emit to individual users if they're online
      io.to(req.user.userId).emit('message-sent', message);
      io.to(receiverId).emit('message-received', message);
      
      console.log('✅ Message emitted to socket');
    } else {
      console.log('⚠️ Socket.IO not available');
    }

    res.status(201).json({ 
      message: message,
      success: true 
    });
  } catch (error) {
    console.error('❌ Message send error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation between two users
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: req.user.userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user.userId }
      ]
    })
      .populate('senderId', 'name email profileImage')
      .populate('receiverId', 'name email profileImage')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Message.countDocuments({
      $or: [
        { senderId: req.user.userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user.userId }
      ]
    });

    res.json({
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's conversations list
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all unique conversations for the user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user.userId },
            { receiverId: req.user.userId }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.user.userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $last: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', req.user.userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const user = await User.findById(conv._id).select('name email profileImage role');
        
        // If user is a doctor, include their specialty
        if (user && user.role === 'doctor') {
          const Doctor = (await import('../models/Doctor.js')).default;
          const doctorProfile = await Doctor.findOne({ userId: user._id }).select('specialty');
          return {
            ...conv,
            user: {
              ...user.toObject(),
              specialty: doctorProfile?.specialty || 'General Medicine'
            }
          };
        }
        
        return {
          ...conv,
          user
        };
      })
    );

    res.json({ conversations: populatedConversations });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/read/:senderId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        senderId: req.params.senderId,
        receiverId: req.user.userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.userId,
      isRead: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message (sender only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Contact form email endpoint
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: 'watsonliwa@yahoo.com',
      subject: `[Contact Form] ${subject}`,
      text: message,
      html: `<p><strong>From:</strong> ${name} (${email})</p><p><strong>Subject:</strong> ${subject}</p><p>${message}</p>`
    });
    res.json({ message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

export default router; 