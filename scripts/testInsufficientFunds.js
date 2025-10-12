import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testInsufficientFunds = async () => {
  try {
    console.log('🧪 Testing Insufficient Funds Logic');
    console.log('='.repeat(40));

    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'john.doe@test.com',
      password: 'password123'
    });

    const authToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Logged in successfully');

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Get current balance
    const accountResponse = await axios.get('http://localhost:5000/api/account/details', { headers });
    const currentBalance = accountResponse.data.data.account.balance;
    console.log(`💰 Current balance: GHS ${currentBalance}`);

    // Find a valid recipient
    const mongoose = await import('mongoose');
    await mongoose.default.connect(process.env.MONGODB_URI);
    const Account = (await import('../src/models/Account.js')).default;
    const recipientAccount = await Account.findOne({ 
      accountNumber: { $ne: accountResponse.data.data.account.accountNumber } 
    });
    await mongoose.default.connection.close();

    if (!recipientAccount) {
      console.log('❌ No recipient account found for testing');
      return;
    }

    console.log(`🎯 Using recipient: ${recipientAccount.accountNumber}`);

    // Test 1: Transfer exactly the current balance (should work)
    console.log('\n🔍 Test 1: Transferring exact balance...');
    try {
      const exactTransfer = await axios.post('http://localhost:5000/api/account/transfer', {
        recipientAccountNumber: recipientAccount.accountNumber,
        amount: currentBalance,
        description: 'Test exact balance transfer'
      }, { headers });

      console.log('✅ Exact balance transfer succeeded');
      console.log('New balance:', exactTransfer.data.data.newBalance);
    } catch (error) {
      console.log('❌ Exact balance transfer failed:', error.response?.data?.message);
    }

    // Test 2: Transfer more than balance (should fail)
    console.log('\n🔍 Test 2: Transferring more than balance...');
    try {
      const largeTransfer = await axios.post('http://localhost:5000/api/account/transfer', {
        recipientAccountNumber: recipientAccount.accountNumber,
        amount: currentBalance + 1000.00,
        description: 'Test insufficient funds'
      }, { headers });

      console.log('❌ Large transfer should have failed but succeeded!');
      console.log('This indicates a bug in insufficient funds validation');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Insufficient')) {
        console.log('✅ Insufficient funds correctly prevented:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testInsufficientFunds();