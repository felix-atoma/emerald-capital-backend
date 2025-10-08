// scripts/testUserModel.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import config from '../src/config/config.js';

async function testUserModel() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Test creating a new user to see if pre-save hook works
    console.log('\n🧪 Testing User model pre-save hook...');
    
    const testUser = await User.create({
      sex: 'male',
      firstName: 'Test',
      lastName: 'Hook',
      dateOfBirth: new Date('1990-01-01'),
      phone: '+233244111111',
      email: 'testhook@emeraldcapital.com',
      ghanaCardNumber: 'GHA-111111111-1',
      homeAddress: 'Test Address',
      region: 'Greater Accra',
      nextOfKin: [{
        relationship: 'spouse',
        firstName: 'Test',
        lastName: 'Spouse'
      }],
      nextOfKinPhone: '+233244111112',
      employmentType: ['private'],
      employer: 'Test Employer',
      staffNumber: 'EMP-TEST-HOOK',
      employmentDate: new Date('2023-01-01'),
      gradeLevel: 'Test',
      lastMonthPay: 5000,
      username: 'testhook',
      password: 'testhook123'
    });

    console.log('✅ Test user created');
    console.log(`   Password stored as: ${testUser.password}`);
    console.log(`   Is hashed: ${testUser.password.startsWith('$2a$') || testUser.password.startsWith('$2b$')}`);

    // Clean up
    await User.deleteOne({ username: 'testhook' });
    console.log('🧹 Test user cleaned up');

  } catch (error) {
    console.error('❌ Error testing User model:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
}

testUserModel();