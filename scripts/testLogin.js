// scripts/testLogin.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import config from '../src/config/config.js';

async function testLogin() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Test admin login - using the FIXED method with one parameter
    const admin = await User.findOne({ username: 'admin' }).select('+password');
    if (admin) {
      const isAdminPasswordCorrect = await admin.correctPassword('admin123');
      console.log(`🔐 Admin login test: ${isAdminPasswordCorrect ? '✅ SUCCESS' : '❌ FAILED'}`);
    } else {
      console.log('❌ Admin user not found');
    }

    // Test user login - using the FIXED method with one parameter
    const user = await User.findOne({ username: 'testuser' }).select('+password');
    if (user) {
      const isUserPasswordCorrect = await user.correctPassword('test123456');
      console.log(`🔐 User login test: ${isUserPasswordCorrect ? '✅ SUCCESS' : '❌ FAILED'}`);
    } else {
      console.log('❌ Test user not found');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

testLogin();