// scripts/fixPasswords.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import config from '../src/config/config.js';

async function fixPasswords() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Fix admin password
    const admin = await User.findOne({ username: 'admin' }).select('+password');
    if (admin) {
      console.log('\n🔧 Fixing admin password...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      admin.password = hashedPassword;
      await admin.save();
      console.log('✅ Admin password fixed and hashed');
    }

    // Fix test user password
    const testUser = await User.findOne({ username: 'testuser' }).select('+password');
    if (testUser) {
      console.log('\n🔧 Fixing test user password...');
      const hashedPassword = await bcrypt.hash('test123456', 12);
      testUser.password = hashedPassword;
      await testUser.save();
      console.log('✅ Test user password fixed and hashed');
    }

    console.log('\n✅ All passwords have been properly hashed!');

  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

fixPasswords();