// fix-emerald-admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Note: bcryptjs not bcrypt
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://felixatoma2:yvaPR1cxDGkMQxG2@cluster0.wllhjbf.mongodb.net/nashma?retryWrites=true&w=majority&appName=Cluster0';

async function checkAndFixEmeraldAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the User model
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    // Step 1: Check if EmeraldAdmin exists
    console.log('🔍 Step 1: Checking for EmeraldAdmin account...');
    const existingAdmin = await User.findOne({ username: 'EmeraldAdmin' });
    
    if (existingAdmin) {
      console.log('✅ EmeraldAdmin account found!');
      console.log('📝 Account details:');
      console.log('   Username:', existingAdmin.username);
      console.log('   Email:', existingAdmin.email || 'Not set');
      console.log('   Role:', existingAdmin.role);
      console.log('   Name:', existingAdmin.firstName, existingAdmin.lastName);
      console.log('   Password hash:', existingAdmin.password.substring(0, 29) + '...');
      console.log('   Password starts with $2:', existingAdmin.password.startsWith('$2'));
      console.log('   Password length:', existingAdmin.password.length);
      
      // Test current password
      console.log('\n🧪 Testing current password "Emerald@Admin1&$"...');
      const currentPassword = 'Emerald@Admin1&$';
      const isCurrentMatch = await bcrypt.compare(currentPassword, existingAdmin.password);
      console.log('   Current password matches:', isCurrentMatch ? '✅ YES' : '❌ NO');
      
      if (!isCurrentMatch) {
        console.log('\n🔄 Step 2: Updating password...');
        
        // Hash the new password
        const newPassword = 'Emerald@Admin1&$';
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        console.log('🔑 New password hash:', hashedPassword.substring(0, 29) + '...');
        
        // Update the admin account
        existingAdmin.password = hashedPassword;
        existingAdmin.isActive = true;
        await existingAdmin.save();
        
        console.log('✅ Password updated successfully!');
        
        // Verify the password
        console.log('\n🧪 Step 3: Verifying new password...');
        const isMatch = await bcrypt.compare(newPassword, hashedPassword);
        console.log('   Password verification:', isMatch ? '✅ PASS' : '❌ FAIL');
        
        if (isMatch) {
          console.log('\n🎉 SUCCESS! EmeraldAdmin account is now ready to use!');
          console.log('📋 Login credentials:');
          console.log('   Username: EmeraldAdmin');
          console.log('   Password: Emerald@Admin1&$');
        }
      } else {
        console.log('\n✅ EmeraldAdmin password is already correct!');
        console.log('📋 Login credentials:');
        console.log('   Username: EmeraldAdmin');
        console.log('   Password: Emerald@Admin1&$');
      }
      
    } else {
      console.log('❌ EmeraldAdmin account NOT found!');
      console.log('\n🆕 Step 2: Creating new EmeraldAdmin account...');
      
      // Create new admin account
      const newPassword = 'Emerald@Admin1&$';
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      const newAdmin = new User({
        username: 'EmeraldAdmin',
        password: hashedPassword,
        email: 'admin@emerald.com',
        firstName: 'Emerald',
        lastName: 'Admin',
        role: 'admin',
        isActive: true
      });
      
      await newAdmin.save();
      
      console.log('✅ EmeraldAdmin account created!');
      console.log('📋 Login credentials:');
      console.log('   Username: EmeraldAdmin');
      console.log('   Password: Emerald@Admin1&$');
    }
    
    // List all admins
    console.log('\n📋 Step 4: Current admin accounts:');
    const allAdmins = await User.find({ role: 'admin' }, { password: 0 }).lean();
    
    if (allAdmins.length > 0) {
      console.table(allAdmins.map(admin => ({
        Username: admin.username,
        Email: admin.email || 'Not set',
        Name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
        Role: admin.role,
        Active: admin.isActive || true
      })));
      console.log(`\n📊 Total admin users: ${allAdmins.length}`);
    } else {
      console.log('   No admin users found!');
    }
    
    console.log('\n✅ Script completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the fix
console.log('🚀 Emerald Admin Account Checker & Fixer\n');
console.log('='.repeat(50));
checkAndFixEmeraldAdmin();