import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import messagesRoutes from './routes/messages.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Change the port to 3002 to avoid conflicts
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://watsonwaswa:UTqKOZBvDQ8rBAqT@cluster0.w2nwnyx.mongodb.net/tibabu-health?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('✅ Connected to MongoDB Atlas - tibabu-health database'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Socket.IO connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Handle user authentication
  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log('✅ User authenticated:', userId, 'Socket ID:', socket.id);
  });

  // Handle joining a conversation room
  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    console.log('👥 User joined conversation:', conversationId, 'Socket ID:', socket.id);
  });

  // Handle leaving a conversation room
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log('👋 User left conversation:', conversationId, 'Socket ID:', socket.id);
  });

  // Handle new message
  socket.on('new-message', (messageData) => {
    const { conversationId, message } = messageData;
    socket.to(conversationId).emit('message-received', message);
    console.log('📨 Message sent to conversation:', conversationId);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { conversationId, userId, isTyping } = data;
    socket.to(conversationId).emit('user-typing', { userId, isTyping });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log('❌ User disconnected:', socket.userId, 'Socket ID:', socket.id);
    }
  });
});

// Log connected users periodically
setInterval(() => {
  console.log('👥 Currently connected users:', Array.from(connectedUsers.keys()));
}, 30000); // Log every 30 seconds

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tibabu Health Connect API is running' });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for real-time messaging`);
}); 