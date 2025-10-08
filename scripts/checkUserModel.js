// scripts/checkUserModel.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import config from '../src/config/config.js';

async function checkUserModel() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Checking User Model Structure:');
    
    // Create a test user and examine the instance
    const testUser = await User.findOne({ username: 'admin' }).select('+password');
    if (testUser) {
      console.log('\n👑 Admin User Instance Analysis:');
      console.log(`   Instance type: ${typeof testUser}`);
      console.log(`   Has password property: ${'password' in testUser}`);
      console.log(`   Password value: ${testUser.password}`);
      console.log(`   Password type: ${typeof testUser.password}`);
      console.log(`   Is password a string: ${typeof testUser.password === 'string'}`);
      console.log(`   Password length: ${testUser.password.length}`);
      
      // Test the correctPassword method directly
      console.log('\n🧪 Testing correctPassword method:');
      const result = await testUser.correctPassword('admin123');
      console.log(`   correctPassword result: ${result}`);
      
      // Test what happens if we call bcrypt directly with the instance's password
      const bcrypt = await import('bcryptjs');
      const directResult = await bcrypt.compare('admin123', testUser.password);
      console.log(`   Direct bcrypt.compare result: ${directResult}`);
    }

  } catch (error) {
    console.error('❌ Check User Model error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

checkUserModel();