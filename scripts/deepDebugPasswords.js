// scripts/deepDebugPasswords.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import config from '../src/config/config.js';

async function deepDebugPasswords() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 DEEP DEBUG - Password Analysis:');

    // Test admin
    const admin = await User.findOne({ username: 'admin' }).select('+password');
    if (admin) {
      console.log('\n👑 Admin Deep Analysis:');
      console.log(`   Stored hash: ${admin.password}`);
      console.log(`   Hash starts with $2a$: ${admin.password.startsWith('$2a$')}`);
      console.log(`   Hash starts with $2b$: ${admin.password.startsWith('$2b$')}`);
      console.log(`   Hash length: ${admin.password.length}`);
      
      // Test multiple password possibilities
      const testPasswords = [
        'admin123',
        'Admin123',
        'ADMIN123',
        'admin123 ',
        ' admin123',
        'admin123!',
        'admin1234',
        'admin'
      ];
      
      for (const testPassword of testPasswords) {
        const match = await bcrypt.compare(testPassword, admin.password);
        if (match) {
          console.log(`   ✅ FOUND MATCH: "${testPassword}"`);
          break;
        } else {
          console.log(`   ❌ No match: "${testPassword}"`);
        }
      }
    }

    // Test user
    const testUser = await User.findOne({ username: 'testuser' }).select('+password');
    if (testUser) {
      console.log('\n👤 Test User Deep Analysis:');
      console.log(`   Stored hash: ${testUser.password}`);
      console.log(`   Hash starts with $2a$: ${testUser.password.startsWith('$2a$')}`);
      console.log(`   Hash starts with $2b$: ${testUser.password.startsWith('$2b$')}`);
      console.log(`   Hash length: ${testUser.password.length}`);
      
      // Test multiple password possibilities
      const testPasswords = [
        'test123456',
        'Test123456',
        'TEST123456',
        'test123456 ',
        ' test123456',
        'test123456!',
        'test12345',
        'test1234567',
        'testuser123'
      ];
      
      for (const testPassword of testPasswords) {
        const match = await bcrypt.compare(testPassword, testUser.password);
        if (match) {
          console.log(`   ✅ FOUND MATCH: "${testPassword}"`);
          break;
        } else {
          console.log(`   ❌ No match: "${testPassword}"`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Deep debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

deepDebugPasswords();