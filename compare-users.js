// compare-users.js
import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://felixatoma2:yvaPR1cxDGkMQxG2@cluster0.wllhjbf.mongodb.net/nashma?retryWrites=true&w=majority&appName=Cluster0';

async function compareUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Get both users
    const emerald = await User.findOne({ username: 'EmeraldAdmin' }).lean();
    const adminUser = await User.findOne({ username: 'adminuser' }).lean();
    
    console.log('📊 USER COMPARISON:\n');
    
    console.log('=== EmeraldAdmin (FAILING) ===');
    console.log(JSON.stringify(emerald, null, 2));
    
    console.log('\n=== adminuser (WORKING) ===');
    console.log(JSON.stringify(adminUser, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

compareUsers();