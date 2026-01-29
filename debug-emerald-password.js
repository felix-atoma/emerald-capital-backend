// debug-emerald-password.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://felixatoma2:yvaPR1cxDGkMQxG2@cluster0.wllhjbf.mongodb.net/nashma?retryWrites=true&w=majority&appName=Cluster0';

async function debugPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Get EmeraldAdmin
    const admin = await User.findOne({ username: 'EmeraldAdmin' });
    
    if (!admin) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('🔍 EmeraldAdmin details:');
    console.log('Username:', admin.username);
    console.log('Email:', admin.email);
    console.log('Full password hash:', admin.password);
    console.log('Hash algorithm:', admin.password.substring(0, 3));
    console.log('Cost factor:', admin.password.substring(4, 6));
    console.log('Salt:', admin.password.substring(7, 29));
    console.log('Hash length:', admin.password.length);
    
    // Test with bcryptjs
    console.log('\n🧪 Testing with bcryptjs:');
    const testPassword = 'Emerald@Admin1&$';
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    console.log(`Password "${testPassword}" matches:`, isMatch);
    
    // Test with what your backend might be doing
    console.log('\n🔧 Testing hash generation:');
    
    // Generate a new hash with same salt
    console.log('Original hash:', admin.password);
    
    // Try different cost factors
    console.log('\n🔄 Trying different cost factors:');
    for (let rounds = 10; rounds <= 15; rounds++) {
      const newHash = await bcrypt.hash(testPassword, rounds);
      const matches = await bcrypt.compare(testPassword, newHash);
      console.log(`Rounds ${rounds}: ${matches ? '✅' : '❌'}`);
      
      // Check if hash structure matches
      if (newHash.substring(0, 7) === admin.password.substring(0, 7)) {
        console.log(`   Hash prefix matches original!`);
      }
    }
    
    // Check if password might have extra whitespace
    console.log('\n🔍 Checking for whitespace issues:');
    const variations = [
      'Emerald@Admin1&$',
      ' Emerald@Admin1&$',
      'Emerald@Admin1&$ ',
      'Emerald@Admin1&$\n',
      'Emerald@Admin1&$\t'
    ];
    
    for (const variation of variations) {
      const match = await bcrypt.compare(variation, admin.password);
      console.log(`"${variation}" (length: ${variation.length}) matches: ${match ? '✅ YES' : '❌ NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

debugPassword();