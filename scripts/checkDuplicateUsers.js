// scripts/checkDuplicateUsers.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import config from '../src/config/config.js';

async function checkDuplicateUsers() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Checking for duplicate users:');

    // Check for multiple admin users
    const adminUsers = await User.find({ username: 'admin' }).select('+password');
    console.log(`\n👑 Found ${adminUsers.length} admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`   Admin ${index + 1}:`);
      console.log(`     ID: ${user._id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Password hash: ${user.password}`);
      console.log(`     Created: ${user.createdAt}`);
    });

    // Check for multiple test users
    const testUsers = await User.find({ username: 'testuser' }).select('+password');
    console.log(`\n👤 Found ${testUsers.length} test users:`);
    testUsers.forEach((user, index) => {
      console.log(`   Test User ${index + 1}:`);
      console.log(`     ID: ${user._id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Password hash: ${user.password}`);
      console.log(`     Created: ${user.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Check duplicates error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

checkDuplicateUsers();