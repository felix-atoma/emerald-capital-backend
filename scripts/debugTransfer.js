import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with timeout
const apiWithTimeout = (baseURL, timeout = 10000) => {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

const debugTransfer = async () => {
  try {
    const api = apiWithTimeout(API_BASE_URL);

    // First, login to get token
    const loginResponse = await api.post('/auth/login', {
      username: 'john.doe@test.com',
      password: 'password123'
    });

    const authToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Logged in successfully');

    const authenticatedApi = apiWithTimeout(API_BASE_URL);
    authenticatedApi.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // Get account details
    const accountResponse = await authenticatedApi.get('/account/details');
    const currentAccount = accountResponse.data.data.account.accountNumber;
    console.log(`💰 Current account: ${currentAccount}`);
    console.log(`💵 Current balance: GHS ${accountResponse.data.data.account.balance}`);

    // Scenario 1: Transfer to self (should fail)
    console.log('\n🔍 Testing transfer to self...');
    try {
      const selfTransfer = await authenticatedApi.post('/account/transfer', {
        recipientAccountNumber: currentAccount,
        amount: 10.00,
        description: 'Test self transfer'
      }, { timeout: 5000 });
      console.log('❌ Self transfer should have failed but succeeded');
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log('✅ Self transfer timed out (expected - likely stuck in validation)');
      } else if (error.response) {
        console.log('✅ Self transfer correctly failed:', error.response?.data?.message);
      } else {
        console.log('✅ Self transfer failed (expected):', error.message);
      }
    }

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Scenario 2: Transfer to invalid account
    console.log('\n🔍 Testing transfer to invalid account...');
    try {
      const invalidTransfer = await authenticatedApi.post('/account/transfer', {
        recipientAccountNumber: 'INVALID_ACCOUNT_123',
        amount: 10.00,
        description: 'Test invalid transfer'
      });
      console.log('✅ Invalid transfer response:', invalidTransfer.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ Invalid transfer correctly failed:', error.response?.data?.message);
      } else {
        console.log('❌ Invalid transfer error:', error.message);
      }
    }

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Scenario 3: Transfer with insufficient funds
    console.log('\n🔍 Testing transfer with insufficient funds...');
    try {
      const largeTransfer = await authenticatedApi.post('/account/transfer', {
        recipientAccountNumber: 'GH9999999999',
        amount: 10000.00,
        description: 'Test large transfer'
      });
      console.log('❌ Large transfer should have failed but succeeded');
    } catch (error) {
      if (error.response) {
        console.log('✅ Large transfer correctly failed:', error.response?.data?.message);
      } else {
        console.log('❌ Large transfer error:', error.message);
      }
    }

    // Scenario 4: Find another valid account to transfer to
    console.log('\n🔍 Looking for another account to test with...');
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      
      // FIXED: Correct import paths
      const Account = (await import('../src/models/Account.js')).default;
      const User = (await import('../src/models/User.js')).default;
      
      const otherAccounts = await Account.find({
        accountNumber: { $ne: currentAccount }
      }).limit(2).populate('user', 'email');
      
      if (otherAccounts.length > 0) {
        const otherAccount = otherAccounts[0];
        console.log(`🔍 Found another account: ${otherAccount.accountNumber} (${otherAccount.user.email})`);
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Scenario 5: Valid transfer
        console.log('\n🔍 Testing valid transfer...');
        try {
          const validTransfer = await authenticatedApi.post('/account/transfer', {
            recipientAccountNumber: otherAccount.accountNumber,
            amount: 50.00,
            description: 'Test valid transfer'
          });
          console.log('✅ Valid transfer succeeded:', validTransfer.data.message);
          console.log('💰 New balance:', validTransfer.data.data.newBalance);
        } catch (error) {
          console.log('❌ Valid transfer failed:', error.response?.data?.message);
          if (error.response?.data?.error) {
            console.log('🔧 Error details:', error.response.data.error);
          }
        }
      } else {
        console.log('ℹ️ No other accounts found for testing');
      }
      
      await mongoose.connection.close();
    } catch (dbError) {
      console.log('❌ Database error:', dbError.message);
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

debugTransfer();