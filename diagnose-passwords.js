// diagnose-passwords.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const diagnosePasswords = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define minimal schema
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      role: String
    });

    const User = mongoose.model('User', userSchema);

    console.log('🔍 Checking both admin users...\n');
    
    // Find both users
    const users = await User.find({
      $or: [
        { username: 'adminuser' },
        { username: 'EmeraldAdmin' },
        { email: 'admin@emerald.com' },
        { email: 'admin@test.com' }
      ]
    });

    console.log(`📊 Found ${users.length} users to check:\n`);

    for (const user of users) {
      console.log(`👤 User: ${user.username || 'N/A'} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password hash: ${user.password ? user.password.substring(0, 30) + '...' : 'MISSING'}`);
      console.log(`   Hash length: ${user.password?.length || 0}`);
      console.log(`   Hash prefix: ${user.password?.substring(0, 7) || 'N/A'}`);
      
      // Test passwords
      console.log('\n   🔐 Testing password verification:');
      
      if (user.username === 'adminuser') {
        const test1 = await bcrypt.compare('admin123', user.password);
        console.log(`     "admin123": ${test1 ? '✅ MATCHES' : '❌ FAILS'}`);
        
        // Try wrong password
        const test2 = await bcrypt.compare('wrongpass', user.password);
        console.log(`     "wrongpass": ${test2 ? '✅ MATCHES' : '❌ FAILS (expected)'}`);
      }
      
      if (user.username === 'EmeraldAdmin' || user.email === 'admin@emerald.com') {
        const test1 = await bcrypt.compare('Emerald@Admin1&$', user.password);
        console.log(`     "Emerald@Admin1&$": ${test1 ? '✅ MATCHES' : '❌ FAILS'}`);
        
        // Try simpler version
        const test2 = await bcrypt.compare('EmeraldAdmin123', user.password);
        console.log(`     "EmeraldAdmin123": ${test2 ? '✅ MATCHES' : '❌ FAILS'}`);
        
        // Try without special chars
        const test3 = await bcrypt.compare('EmeraldAdmin1', user.password);
        console.log(`     "EmeraldAdmin1": ${test3 ? '✅ MATCHES' : '❌ FAILS'}`);
      }
      
      console.log('   ──────────────────────\n');
    }

    // Check bcrypt version compatibility
    console.log('🔧 Testing bcrypt compatibility...\n');
    
    // Test hash generation with both passwords
    const testPasswords = [
      'admin123',
      'Emerald@Admin1&$',
      'EmeraldAdmin123',
      'password123'
    ];
    
    for (const pwd of testPasswords) {
      try {
        const hash = await bcrypt.hash(pwd, 12);
        const compareResult = await bcrypt.compare(pwd, hash);
        console.log(`   "${pwd}": Hash works ${compareResult ? '✅' : '❌'}`);
        console.log(`     Hash: ${hash.substring(0, 30)}...`);
        console.log(`     Length: ${hash.length}`);
      } catch (error) {
        console.log(`   "${pwd}": ❌ Error - ${error.message}`);
      }
      console.log('');
    }

    // Check what bcrypt version we're using
    console.log('📦 Bcrypt version info:');
    console.log('   bcryptjs version:', require('bcryptjs/package.json').version);
    
    await mongoose.disconnect();
    console.log('\n✅ Diagnosis complete.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

diagnosePasswords();