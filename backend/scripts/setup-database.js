import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Message from '../models/Message.js';

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://watsonwaswa:UTqKOZBvDQ8rBAqT@cluster0.w2nwnyx.mongodb.net/tibabu-health?retryWrites=true&w=majority&appName=Cluster0';

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await Message.deleteMany({});
    console.log('✅ Existing data cleared!');

    // Create admin user
    console.log('👑 Creating admin user...');
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@tibabu.com',
      password: 'admin123',
      role: 'admin',
      phone: '+254717629522',
      isActive: true,
      emailVerified: true
    });
    await adminUser.save();
    console.log('✅ Admin user created: admin@tibabu.com / admin123');

    // Create sample doctor users (unverified)
    console.log('👩‍⚕️ Creating sample doctor users...');
    
    const doctor1 = new User({
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@tibabu.com',
      password: 'doctor123',
      role: 'doctor',
      phone: '+254717629523',
      isActive: true,
      emailVerified: true
    });
    await doctor1.save();

    const doctor2 = new User({
      name: 'Dr. Michael Chen',
      email: 'michael.chen@tibabu.com',
      password: 'doctor123',
      role: 'doctor',
      phone: '+254717629524',
      isActive: true,
      emailVerified: true
    });
    await doctor2.save();

    const doctor3 = new User({
      name: 'Dr. Emily Rodriguez',
      email: 'emily.rodriguez@tibabu.com',
      password: 'doctor123',
      role: 'doctor',
      phone: '+254717629525',
      isActive: true,
      emailVerified: true
    });
    await doctor3.save();

    // Create doctor profiles (unverified by default)
    console.log('📋 Creating doctor profiles...');
    
    const doctorProfile1 = new Doctor({
      userId: doctor1._id,
      specialty: 'Cardiology',
      licenseNumber: 'DOC001',
      experience: 8,
      education: [
        { degree: 'MBBS', institution: 'University of Nairobi', year: 2015 },
        { degree: 'MD Cardiology', institution: 'Kenyatta University', year: 2018 }
      ],
      consultationFee: 2500,
      isVerified: false,
      isAvailable: true
    });
    await doctorProfile1.save();

    const doctorProfile2 = new Doctor({
      userId: doctor2._id,
      specialty: 'Pediatrics',
      licenseNumber: 'DOC002',
      experience: 12,
      education: [
        { degree: 'MBBS', institution: 'University of Nairobi', year: 2012 },
        { degree: 'MD Pediatrics', institution: 'University of Nairobi', year: 2016 }
      ],
      consultationFee: 2000,
      isVerified: false,
      isAvailable: true
    });
    await doctorProfile2.save();

    const doctorProfile3 = new Doctor({
      userId: doctor3._id,
      specialty: 'Dermatology',
      licenseNumber: 'DOC003',
      experience: 6,
      education: [
        { degree: 'MBBS', institution: 'Moi University', year: 2017 },
        { degree: 'MD Dermatology', institution: 'University of Nairobi', year: 2020 }
      ],
      consultationFee: 3000,
      isVerified: false,
      isAvailable: true
    });
    await doctorProfile3.save();

    // Create sample patient users
    console.log('👥 Creating sample patient users...');
    
    const patient1 = new User({
      name: 'John Smith',
      email: 'john.smith@tibabu.com',
      password: 'patient123',
      role: 'patient',
      phone: '+254717629526',
      isActive: true,
      emailVerified: true
    });
    await patient1.save();

    const patient2 = new User({
      name: 'Maria Garcia',
      email: 'maria.garcia@tibabu.com',
      password: 'patient123',
      role: 'patient',
      phone: '+254717629527',
      isActive: true,
      emailVerified: true
    });
    await patient2.save();

    const patient3 = new User({
      name: 'David Wilson',
      email: 'david.wilson@tibabu.com',
      password: 'patient123',
      role: 'patient',
      phone: '+254717629528',
      isActive: true,
      emailVerified: true
    });
    await patient3.save();

    console.log('✅ Sample users created!');

    // Create sample appointments
    console.log('📅 Creating sample appointments...');
    
    const appointment1 = new Appointment({
      patientId: patient1._id,
      doctorId: doctorProfile1._id,
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      appointmentTime: '10:00',
      status: 'pending',
      type: 'consultation',
      symptoms: 'Chest pain and shortness of breath',
      isUrgent: true,
      consultationFee: 2500,
      paymentStatus: 'pending'
    });
    await appointment1.save();

    const appointment2 = new Appointment({
      patientId: patient2._id,
      doctorId: doctorProfile2._id,
      appointmentDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      appointmentTime: '14:30',
      status: 'pending',
      type: 'routine', // changed from 'checkup' to 'routine'
      symptoms: 'Regular health checkup',
      isUrgent: false,
      consultationFee: 2000,
      paymentStatus: 'paid'
    });
    await appointment2.save();

    const appointment3 = new Appointment({
      patientId: patient3._id,
      doctorId: doctorProfile3._id,
      appointmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      appointmentTime: '09:00',
      status: 'completed',
      type: 'consultation',
      symptoms: 'Skin rash and itching',
      isUrgent: false,
      consultationFee: 3000,
      paymentStatus: 'paid'
    });
    await appointment3.save();

    console.log('✅ Sample appointments created!');

    // Create sample messages
    console.log('💬 Creating sample messages...');
    
    const message1 = new Message({
      senderId: patient1._id,
      receiverId: doctor1._id,
      content: 'Hello Dr. Johnson, I have a question about my medication.',
      messageType: 'text',
      isRead: false
    });
    await message1.save();

    const message2 = new Message({
      senderId: doctor1._id,
      receiverId: patient1._id,
      content: 'Hello John, I\'m here to help. What would you like to know?',
      messageType: 'text',
      isRead: true
    });
    await message2.save();

    const message3 = new Message({
      senderId: patient2._id,
      receiverId: doctor2._id,
      content: 'Thank you for the consultation yesterday, Dr. Chen.',
      messageType: 'text',
      isRead: false
    });
    await message3.save();

    console.log('✅ Sample messages created!');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- ${await User.countDocuments()} users created`);
    console.log(`- ${await Doctor.countDocuments()} doctor profiles created`);
    console.log(`- ${await Appointment.countDocuments()} appointments created`);
    console.log(`- ${await Message.countDocuments()} messages created`);
    
    console.log('\n🔑 Admin Account:');
    console.log('Admin: admin@tibabu.com / admin123');
    console.log('\n📝 Note: Doctor accounts are created but need admin verification');
    console.log('Admin can verify doctors through the admin dashboard');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setupDatabase(); 