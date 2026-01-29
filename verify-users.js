// verify-users.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const verifyUsers = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define the User schema (same as your backend)
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      role: String,
      firstName: String,
      lastName: String
    });

    const User = mongoose.model('User', userSchema);

    console.log('👥 Checking all users in database...\n');
    
    // Find all users
    const users = await User.find({}, 'username email role firstName lastName password').lean();
    
    console.log(`📊 Found ${users.length} users:`);
    console.log('='.repeat(80));
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Password hash: ${user.password ? user.password.substring(0, 30) + '...' : 'MISSING'}`);
      console.log(`   Password length: ${user.password?.length || 0}`);
      console.log(`   _id: ${user._id}`);
    }

    console.log('\n' + '='.repeat(80));
    
    // Specifically check for EmeraldAdmin
    console.log('\n🔍 Searching for EmeraldAdmin specifically...');
    const emeraldAdmin = await User.findOne({ username: 'EmeraldAdmin' });
    
    if (emeraldAdmin) {
      console.log('✅ Found EmeraldAdmin user!');
      console.log(`   Email: ${emeraldAdmin.email}`);
      console.log(`   Role: ${emeraldAdmin.role}`);
      console.log(`   Password hash exists: ${!!emeraldAdmin.password}`);
      console.log(`   Password hash length: ${emeraldAdmin.password?.length}`);
      
      // Test password comparison
      console.log('\n🔐 Testing password comparison...');
      const testPassword = 'Emerald@Admin1&$';
      const isMatch = await bcrypt.compare(testPassword, emeraldAdmin.password);
      console.log(`   Password "Emerald@Admin1&$" matches: ${isMatch}`);
      
      // Try to hash a new password to see if it works
      console.log('\n🔧 Testing bcrypt hash generation...');
      try {
        const testHash = await bcrypt.hash(testPassword, 12);
        console.log(`   ✅ Bcrypt hash works. Hash length: ${testHash.length}`);
        
        // Compare the newly hashed password with stored hash
        const isNewHashMatch = await bcrypt.compare(testPassword, testHash);
        console.log(`   New hash comparison: ${isNewHashMatch}`);
      } catch (hashError) {
        console.error('   ❌ Bcrypt hash failed:', hashError.message);
      }
      
    } else {
      console.log('❌ EmeraldAdmin user NOT FOUND in database!');
      
      // Check for other possible usernames
      console.log('\n🔍 Searching for similar users...');
      const similarUsers = await User.find({
        $or: [
          { username: /admin/i },
          { email: /admin/i },
          { role: 'admin' }
        ]
      });
      
      if (similarUsers.length > 0) {
        console.log(`Found ${similarUsers.length} similar users:`);
        similarUsers.forEach(u => {
          console.log(`   - ${u.username} (${u.email}) - Role: ${u.role}`);
        });
      }
    }
    
    // Check for regular user
    console.log('\n🔍 Checking for regular user (johndoe)...');
    const johnDoe = await User.findOne({ username: 'johndoe' });
    if (johnDoe) {
      console.log('✅ Found johndoe user!');
      console.log(`   Testing password "password123"...`);
      const isMatch = await bcrypt.compare('password123', johnDoe.password);
      console.log(`   Password matches: ${isMatch}`);
    }

    // Cleanup
    await mongoose.disconnect();
    console.log('\n✅ Verification complete. Database disconnected.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

verifyUsers();