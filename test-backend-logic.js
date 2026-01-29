// test-backend-logic.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const testBackendLogic = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Use your actual User model (import it properly)
    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean,
      isVerified: Boolean
    }));

    console.log('🧪 Testing backend login logic simulation...\n');
    
    // Test both users
    const testCases = [
      {
        username: 'adminuser',
        password: 'admin123',
        description: 'Working user'
      },
      {
        username: 'EmeraldAdmin',
        password: 'Emerald@Admin1&$',
        description: 'Failing user'
      },
      {
        username: 'johndoe',
        password: 'password123',
        description: 'Regular user'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.description}`);
      console.log(`   Username: ${testCase.username}`);
      console.log(`   Password: ${testCase.password}`);
      console.log('─'.repeat(40));
      
      // Step 1: Find user by username
      const user = await User.findOne({ 
        username: testCase.username 
      }).select('+password');
      
      if (!user) {
        console.log('   ❌ User not found by username');
        
        // Try by email
        const userByEmail = await User.findOne({
          email: testCase.username.includes('@') 
            ? testCase.username 
            : `${testCase.username}@test.com`
        }).select('+password');
        
        if (userByEmail) {
          console.log(`   ⚠️ Found by email: ${userByEmail.email}`);
          console.log(`   Username in DB: ${userByEmail.username}`);
          console.log(`   Role: ${userByEmail.role}`);
          console.log(`   isActive: ${userByEmail.isActive}`);
          console.log(`   isVerified: ${userByEmail.isVerified}`);
          
          // Test password
          const isMatch = await bcrypt.compare(testCase.password, userByEmail.password);
          console.log(`   Password match: ${isMatch ? '✅' : '❌'}`);
          
          if (!isMatch) {
            console.log(`   Hash: ${userByEmail.password.substring(0, 30)}...`);
            console.log(`   Hash prefix: ${userByEmail.password.substring(0, 7)}`);
          }
        } else {
          console.log('   ❌ User not found by email either');
        }
      } else {
        console.log(`   ✅ User found: ${user.username} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   isActive: ${user.isActive}`);
        console.log(`   isVerified: ${user.isVerified}`);
        
        // Step 2: Check if user is active
        if (user.isActive === false) {
          console.log('   ❌ User is not active');
        }
        
        // Step 3: Check if user is verified
        if (user.isVerified === false) {
          console.log('   ⚠️ User is not verified');
        }
        
        // Step 4: Compare password
        const isMatch = await bcrypt.compare(testCase.password, user.password);
        console.log(`   Password match: ${isMatch ? '✅' : '❌'}`);
        
        if (!isMatch) {
          console.log(`   Hash: ${user.password.substring(0, 30)}...`);
          console.log(`   Hash prefix: ${user.password.substring(0, 7)}`);
          
          // Try common variations
          console.log('\n   🔄 Testing password variations:');
          const variations = [
            'EmeraldAdmin1&$',
            'Emerald@Admin1',
            'EmeraldAdmin123',
            'Admin123!',
            testCase.password.toLowerCase(),
            testCase.password.toUpperCase()
          ];
          
          for (const variation of variations) {
            const varMatch = await bcrypt.compare(variation, user.password);
            if (varMatch) {
              console.log(`     "${variation}": ✅ MATCHES!`);
              break;
            }
          }
        }
        
        // Step 5: Check role for admin access
        if (user.role !== 'admin' && user.role !== 'officer') {
          console.log('   ⚠️ User does not have admin role');
        }
      }
    }

    // Test bcrypt with special characters
    console.log('\n🔧 Testing bcrypt with special characters:');
    const specialPassword = 'Emerald@Admin1&$';
    
    try {
      const hash = await bcrypt.hash(specialPassword, 12);
      const compare = await bcrypt.compare(specialPassword, hash);
      console.log(`   Hash/compare with "${specialPassword}": ${compare ? '✅ Works' : '❌ Fails'}`);
      console.log(`   Generated hash: ${hash.substring(0, 30)}...`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Backend logic test complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testBackendLogic();