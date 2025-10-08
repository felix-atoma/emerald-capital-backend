// scripts/resetAndSetup.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import config from '../src/config/config.js';

async function resetAndSetup() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Delete ALL existing test users
    await User.deleteMany({ 
      $or: [
        { username: 'admin' }, 
        { username: 'testuser' },
        { email: 'admin@emeraldcapital.com' },
        { email: 'testuser@emeraldcapital.com' }
      ] 
    });
    console.log('🗑️  Cleared all existing test users');

    // Create admin user with MANUALLY HASHED password
    console.log('\n🔧 Creating admin user...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await User.create({
      sex: 'male',
      firstName: 'System',
      lastName: 'Administrator',
      middleName: '',
      dateOfBirth: new Date('1980-01-01'),
      phone: '+233200000000',
      otherPhone: '+233200000001',
      email: 'admin@emeraldcapital.com',
      ghanaCardNumber: 'GHA-123456789-0',
      homeAddress: 'Emerald Capital Headquarters, Airport City, Accra',
      region: 'Greater Accra',
      nextOfKin: [{
        relationship: 'spouse',
        firstName: 'Admin',
        lastName: 'Spouse'
      }],
      nextOfKinPhone: '+233200000002',
      employmentType: ['civilService'],
      employer: 'Emerald Capital Microfinance',
      staffNumber: 'EMP-ADMIN-001',
      employmentDate: new Date('2020-01-01'),
      gradeLevel: 'Executive',
      lastMonthPay: 15000,
      username: 'admin',
      password: hashedAdminPassword, // Use pre-hashed password
      accountNumber: 'ACC-ADMIN-001',
      isVerified: true,
      isActive: true,
      role: 'admin'
    });
    console.log('✅ Admin user created with manually hashed password');

    // Create test user with MANUALLY HASHED password
    console.log('\n🔧 Creating test user...');
    const hashedTestPassword = await bcrypt.hash('test123456', 12);
    const testUser = await User.create({
      sex: 'male',
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Kwame',
      dateOfBirth: new Date('1990-05-15'),
      phone: '+233244123456',
      otherPhone: '+233244123457',
      email: 'testuser@emeraldcapital.com',
      ghanaCardNumber: 'GHA-987654321-1',
      homeAddress: '123 Test Street, East Legon, Accra',
      region: 'Greater Accra',
      nextOfKin: [{
        relationship: 'spouse',
        firstName: 'Jane',
        lastName: 'Doe'
      }],
      nextOfKinPhone: '+233244123458',
      employmentType: ['private'],
      employer: 'Test Company Limited',
      staffNumber: 'EMP-TEST-001',
      employmentDate: new Date('2022-06-01'),
      gradeLevel: 'Manager',
      lastMonthPay: 8000,
      username: 'testuser',
      password: hashedTestPassword, // Use pre-hashed password
      accountNumber: 'ACC-TEST-001',
      isVerified: true,
      isActive: true,
      role: 'user'
    });
    console.log('✅ Test user created with manually hashed password');

    console.log('\n📋 Final Verification:');
    
    // Verify admin password
    const verifiedAdmin = await User.findOne({ username: 'admin' }).select('+password');
    const adminMatch = await bcrypt.compare('admin123', verifiedAdmin.password);
    console.log(`   Admin 'admin123' matches: ${adminMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Verify test user password
    const verifiedTestUser = await User.findOne({ username: 'testuser' }).select('+password');
    const testUserMatch = await bcrypt.compare('test123456', verifiedTestUser.password);
    console.log(`   Test user 'test123456' matches: ${testUserMatch ? '✅ SUCCESS' : '❌ FAILED'}`);

  } catch (error) {
    console.error('❌ Reset and setup error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

resetAndSetup();