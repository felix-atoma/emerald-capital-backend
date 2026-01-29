// check-usernames.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkUsernames = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      role: String
    });
    
    const User = mongoose.model('User', userSchema);
    
    // Check specific users
    const users = await User.find({
      $or: [
        { email: 'admin@emerald.com' },
        { email: 'admin@test.com' },
        { email: 'john.doe@test.com' }
      ]
    }, 'username email role');
    
    console.log('🔍 Checking username field:');
    console.log('='.repeat(50));
    
    users.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Username (raw): ${user.username}`);
      console.log(`Username type: ${typeof user.username}`);
      console.log(`Username === undefined: ${user.username === undefined}`);
      console.log(`Username === null: ${user.username === null}`);
      console.log(`Role: ${user.role}`);
      console.log(`_id: ${user._id}`);
    });
    
    // Check if we can find by username
    console.log('\n🔍 Searching by username "EmeraldAdmin":');
    const byUsername = await User.findOne({ username: 'EmeraldAdmin' });
    console.log(`Found by username: ${byUsername ? '✅ Yes' : '❌ No'}`);
    
    // Check if we can find by email
    console.log('\n🔍 Searching by email "admin@emerald.com":');
    const byEmail = await User.findOne({ email: 'admin@emerald.com' });
    console.log(`Found by email: ${byEmail ? '✅ Yes' : '❌ No'}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUsernames();