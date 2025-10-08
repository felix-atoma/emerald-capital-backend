import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './User'; // Fixed import path

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Username:', existingAdmin.username);
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create admin user with correct schema structure
    const adminUser = await User.create({
      // Required fields from schema
      ghanaCardNumber: 'GHA-000000000-0',
      username: 'admin',
      password: 'admin123456', // Will be hashed automatically
      fullName: 'System Administrator',
      phone: '0200000000',
      email: 'admin@emeraldcapital.com',
      address: 'Admin Office, Emerald Capital HQ',
      
      // Optional fields
      sex: 'male',
      dateOfBirth: new Date('1990-01-01'),
      region: 'Greater Accra',
      employmentType: ['administration'],
      employer: 'Emerald Capital',
      staffNumber: 'ADM001',
      
      // Admin specific
      role: 'admin',
      isActive: true
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('=====================================');
    console.log('Username:        admin');
    console.log('Email:           admin@emeraldcapital.com');
    console.log('Password:        admin123456');
    console.log('Role:            admin');
    console.log('Ghana Card:      GHA-000000000-0');
    console.log('=====================================');
    console.log('⚠️  IMPORTANT: Change the password after first login!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();