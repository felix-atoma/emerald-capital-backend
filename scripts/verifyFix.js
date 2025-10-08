// scripts/verifyFix.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import config from '../src/config/config.js ';

async function verifyFix() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Verifying User Model Fix:');
    
    // Test the fixed correctPassword method
    const admin = await User.findOne({ username: 'admin' }).select('+password');
    if (admin) {
      console.log('\n👑 Testing Admin with FIXED method:');
      
      // Test correct password
      const correctMatch = await admin.correctPassword('admin123');
      console.log(`   correctPassword('admin123'): ${correctMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      // Test wrong password
      const wrongMatch = await admin.correctPassword('wrongpassword');
      console.log(`   correctPassword('wrongpassword'): ${wrongMatch ? '❌ WRONG' : '✅ CORRECTLY REJECTED'}`);
    }

    const testUser = await User.findOne({ username: 'testuser' }).select('+password');
    if (testUser) {
      console.log('\n👤 Testing User with FIXED method:');
      
      // Test correct password
      const correctMatch = await testUser.correctPassword('test123456');
      console.log(`   correctPassword('test123456'): ${correctMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      // Test wrong password
      const wrongMatch = await testUser.correctPassword('wrongpassword');
      console.log(`   correctPassword('wrongpassword'): ${wrongMatch ? '❌ WRONG' : '✅ CORRECTLY REJECTED'}`);
    }

  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

verifyFix();