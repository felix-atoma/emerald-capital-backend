// scripts/createTestUser.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import '../src/config/config.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emerald-capital';

const createTestUser = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('ℹ️  Test user already exists:');
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Password: test123456`);
      return existingUser;
    }

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
      password: 'test123456',
      accountNumber: 'ACC-TEST-001',
      
      // Account Status
      isVerified: true,
      isActive: true,
      role: 'user'
    });

    console.log('✅ Test user created successfully!');
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Password: test123456`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Ghana Card: ${testUser.ghanaCardNumber}`);

  } catch (error) {
    console.error('❌ Error creating test user:', error);
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

createTestUser();