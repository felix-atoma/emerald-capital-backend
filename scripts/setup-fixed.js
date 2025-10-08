// scripts/setup-fixed.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import '../src/config/env.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emerald-capital';

async function setupDatabaseFixed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing users to start fresh
    await User.deleteMany({ $or: [{ username: 'admin' }, { username: 'testuser' }] });
    console.log('🗑️  Cleared existing test users');

    // Hash passwords manually
    const hashedAdminPassword = await bcrypt.hash('admin123', 12);
    const hashedTestPassword = await bcrypt.hash('test123456', 12);

    // Create admin user using create() to trigger pre-save hooks
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
      password: hashedAdminPassword, // Use pre-hashed password
      accountNumber: 'ACC-ADMIN-001',
      
      // Account Status
      isVerified: true,
      isActive: true,
      role: 'admin'
    });

    console.log('✅ Admin user created:', adminUser.username);

    // Create test user using create() to trigger pre-save hooks
    const testUser = await User.create({
      // Personal Information
      sex: 'male',
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Kwame',
      dateOfBirth: new Date('1990-05-15'),
      
      // Contact Information
      phone: '+233244123456',
      otherPhone: '+233244123457',
      email: 'testuser@emeraldcapital.com',
      
      // Identification
      ghanaCardNumber: 'GHA-987654321-1',
      
      // Address Information
      homeAddress: '123 Test Street, East Legon, Accra',
      region: 'Greater Accra',
      
      // Next of Kin Information
      nextOfKin: [
        {
          relationship: 'spouse',
          firstName: 'Jane',
          lastName: 'Doe'
        }
      ],
      nextOfKinPhone: '+233244123458',
      
      // Employment Information
      employmentType: ['private'],
      employer: 'Test Company Limited',
      staffNumber: 'EMP-TEST-001',
      employmentDate: new Date('2022-06-01'),
      gradeLevel: 'Manager',
      lastMonthPay: 8000,
      
      // Account Information
      username: 'testuser',
      password: hashedTestPassword, // Use pre-hashed password
      accountNumber: 'ACC-TEST-001',
      
      // Account Status
      isVerified: true,
      isActive: true,
      role: 'user'
    });

    console.log('✅ Test user created:', testUser.username);
    console.log('\n📋 Login Credentials:');
    console.log('   👑 Admin: admin / admin123');
    console.log('   👤 User:  testuser / test123456');
    console.log('\n✅ Passwords are properly hashed and should work now!');

  } catch (error) {
    console.error('❌ Setup error:', error);
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
}

setupDatabaseFixed();