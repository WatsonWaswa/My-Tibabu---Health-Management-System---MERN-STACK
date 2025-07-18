import mongoose from 'mongoose';
import User from './models/User.js';

const MONGODB_URI = 'mongodb+srv://watsonwaswa:UTqKOZBvDQ8rBAqT@cluster0.w2nwnyx.mongodb.net/tibabu-health?retryWrites=true&w=majority&appName=Cluster0';

async function testAuth() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@tibabu.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Found admin user:', adminUser.name);
    console.log('📧 Email:', adminUser.email);
    console.log('🔐 Password hash:', adminUser.password);
    console.log('👑 Role:', adminUser.role);

    // Test password comparison
    const testPassword = 'admin123';
    const isMatch = await adminUser.comparePassword(testPassword);
    console.log('🔍 Password match test:', isMatch);

    // Test with wrong password
    const wrongPassword = 'wrongpassword';
    const isWrongMatch = await adminUser.comparePassword(wrongPassword);
    console.log('❌ Wrong password test:', isWrongMatch);

    // Test patient user
    const patientUser = await User.findOne({ email: 'john.smith@tibabu.com' });
    if (patientUser) {
      console.log('\n👤 Found patient user:', patientUser.name);
      const patientPasswordMatch = await patientUser.comparePassword('patient123');
      console.log('🔍 Patient password match:', patientPasswordMatch);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAuth(); 