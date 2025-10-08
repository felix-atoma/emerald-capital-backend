// scripts/createTestUser.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import config from '../src/config/config.js ';

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('ℹ️  Test user already exists:');
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Password: test123456`);
      return existingUser;
    }

    // Create test user
    const testUser = await User.create({
      ghanaCardNumber: 'GHA-TEST-0001',
      username: 'testuser',
      password: 'test123456',
      fullName: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      phone: '+233123456789',
      email: 'test@emeraldcapital.com',
      address: '123 Test Street, Accra',
      homeAddress: '123 Test Street, Accra',
      region: 'Greater Accra',
      role: 'user',
      isActive: true,
      isVerified: true,
      nextOfKin: [
        {
          relationship: 'spouse',
          firstName: 'Jane',
          lastName: 'Doe'
        }
      ]
    });

    console.log('✅ Test user created successfully!');
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Password: test123456`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}`);

    return testUser;

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📀 Database connection closed');
  }
};

createTestUser();