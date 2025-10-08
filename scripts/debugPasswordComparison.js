// scripts/debugPasswordComparison.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import config from '../src/config/config.js';

async function debugPasswordComparison() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Test admin password comparison
    const admin = await User.findOne({ username: 'admin' }).select('+password');
    if (admin) {
      console.log('\n🔍 Debugging Admin Password Comparison:');
      console.log(`   Stored hash: ${admin.password}`);
      
      // Test with bcrypt directly
      const directMatch = await bcrypt.compare('admin123', admin.password);
      console.log(`   Direct bcrypt.compare('admin123'): ${directMatch}`);
      
      // Test with User model method
      const modelMatch = await admin.correctPassword('admin123', admin.password);
      console.log(`   User.correctPassword('admin123'): ${modelMatch}`);
      
      // Test what happens if we call without second parameter
      try {
        const singleParamMatch = await admin.correctPassword('admin123');
        console.log(`   User.correctPassword('admin123') [single param]: ${singleParamMatch}`);
      } catch (error) {
        console.log(`   User.correctPassword('admin123') [single param]: ERROR - ${error.message}`);
      }
    }

    // Test user password comparison
    const testUser = await User.findOne({ username: 'testuser' }).select('+password');
    if (testUser) {
      console.log('\n🔍 Debugging Test User Password Comparison:');
      console.log(`   Stored hash: ${testUser.password}`);
      
      // Test with bcrypt directly
      const directMatch = await bcrypt.compare('test123456', testUser.password);
      console.log(`   Direct bcrypt.compare('test123456'): ${directMatch}`);
      
      // Test with User model method
      const modelMatch = await testUser.correctPassword('test123456', testUser.password);
      console.log(`   User.correctPassword('test123456'): ${modelMatch}`);
      
      // Test what happens if we call without second parameter
      try {
        const singleParamMatch = await testUser.correctPassword('test123456');
        console.log(`   User.correctPassword('test123456') [single param]: ${singleParamMatch}`);
      } catch (error) {
        console.log(`   User.correctPassword('test123456') [single param]: ERROR - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

debugPasswordComparison();