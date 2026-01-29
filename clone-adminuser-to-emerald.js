// clone-adminuser-to-emerald.js
import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://felixatoma2:yvaPR1cxDGkMQxG2@cluster0.wllhjbf.mongodb.net/nashma?retryWrites=true&w=majority&appName=Cluster0';

async function fixEmeraldAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Get the working adminuser
    const workingAdmin = await User.findOne({ username: 'adminuser' });
    const emeraldAdmin = await User.findOne({ username: 'EmeraldAdmin' });
    
    if (!workingAdmin || !emeraldAdmin) {
      console.log('❌ One or both users not found');
      return;
    }
    
    console.log('🔧 Making EmeraldAdmin match adminuser structure...');
    
    // Copy ALL fields from working admin (except username, email, password)
    Object.keys(workingAdmin.toObject()).forEach(field => {
      if (!['_id', '__v', 'username', 'email', 'password'].includes(field)) {
        emeraldAdmin[field] = workingAdmin[field];
      }
    });
    
    // Ensure critical fields
    emeraldAdmin.role = 'admin';
    emeraldAdmin.isActive = true;
    emeraldAdmin.isVerified = true;
    emeraldAdmin.loginAttempts = 0;
    emeraldAdmin.lockedUntil = null;
    
    await emeraldAdmin.save();
    
    console.log('✅ EmeraldAdmin updated!');
    console.log('\n📋 Verification:');
    
    const updated = await User.findOne({ username: 'EmeraldAdmin' }).lean();
    const working = await User.findOne({ username: 'adminuser' }).lean();
    
    // Remove password for display
    delete updated.password;
    delete working.password;
    
    console.log('\nEmeraldAdmin now:');
    console.log(JSON.stringify(updated, null, 2));
    
    console.log('\nadminuser (reference):');
    console.log(JSON.stringify(working, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Done');
  }
}

fixEmeraldAdmin();