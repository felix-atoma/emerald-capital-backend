// scripts/createAdmin.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import '../src/config/config.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emerald-capital';

const createAdminUser = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    const adminUser = await User.create({
      // Personal Information
      sex: 'male',
      firstName: 'System',
      lastName: 'Administrator',
      middleName: '',
      dateOfBirth: new Date('1980-01-01'),
      
      // Contact Information
      phone: '+233200000000',
      otherPhone: '+233200000001',
      email: 'admin@emeraldcapital.com',
      
      // Identification
      ghanaCardNumber: 'GHA-123456789-0',
      
      // Address Information
      homeAddress: 'Emerald Capital Headquarters, Airport City, Accra',
      region: 'Greater Accra',
      
      // Next of Kin Information
      nextOfKin: [
        {
          relationship: 'spouse',
          firstName: 'Admin',
          lastName: 'Spouse'
        }
      ],
      nextOfKinPhone: '+233200000002',
      
      // Employment Information
      employmentType: ['civilService'],
      employer: 'Emerald Capital Microfinance',
      staffNumber: 'EMP-ADMIN-001',
      employmentDate: new Date('2020-01-01'),
      gradeLevel: 'Executive',
      lastMonthPay: 15000,
      
      // Account Information
      username: 'admin',
      password: 'admin123',
      accountNumber: 'ACC-ADMIN-001',
      
      // Account Status
      isVerified: true,
      isActive: true,
      role: 'admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Password: admin123`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Ghana Card: ${adminUser.ghanaCardNumber}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    if (error.name === 'ValidationError') {
      console.log('Validation errors:');
      Object.keys(error.errors).forEach(field => {
        console.log(`  - ${field}: ${error.errors[field].message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
};

createAdminUser();