// scripts/debugPasswords.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import '../src/config/config.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emerald-capital';

async function debugPasswords() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check admin user
    const admin = await User.findOne({ username: 'admin' }).select('+password');
    console.log('\n🔍 Admin User Debug:');
    console.log(`   Username: ${admin?.username}`);
    console.log(`   Stored Password: ${admin?.password}`);
    console.log(`   Password length: ${admin?.password?.length}`);
    console.log(`   Is Bcrypt hash: ${admin?.password?.startsWith('$2a$') || admin?.password?.startsWith('$2b$')}`);

    // Check test user
    const testUser = await User.findOne({ username: 'testuser' }).select('+password');
    console.log('\n🔍 Test User Debug:');
    console.log(`   Username: ${testUser?.username}`);
    console.log(`   Stored Password: ${testUser?.password}`);
    console.log(`   Password length: ${testUser?.password?.length}`);
    console.log(`   Is Bcrypt hash: ${testUser?.password?.startsWith('$2a$') || testUser?.password?.startsWith('$2b$')}`);

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

debugPasswords();