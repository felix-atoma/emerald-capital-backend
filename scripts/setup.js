// scripts/setup.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import config from '../src/config/config.js';

async function setupDatabase() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({ 
      $or: [
        { username: 'admin' }, 
        { username: 'testuser' }
      ] 
    });
    console.log('🗑️  Cleared existing users');

    // Create admin user using new User() + save()
    const adminUser = new User({
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
      password: 'admin123',
      accountNumber: 'ACC-ADMIN-001',
      isVerified: true,
      isActive: true,
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ Admin user created');

    // Create test user using new User() + save()
    const testUser = new User({
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
      password: 'test123456',
      accountNumber: 'ACC-TEST-001',
      isVerified: true,
      isActive: true,
      role: 'user'
    });
    
    await testUser.save();
    console.log('✅ Test user created');

    console.log('\n📋 Login Credentials:');
    console.log('   👑 Admin: admin / admin123');
    console.log('   👤 User:  testuser / test123456');
    console.log('\n✅ Users created successfully!');

  } catch (error) {
    console.error('❌ Setup error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

setupDatabase();