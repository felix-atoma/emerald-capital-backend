import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

const simpleTransferTest = async () => {
  try {
    console.log('🔍 Simple Transfer Test');
    console.log('='.repeat(40));

    // Login
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'john.doe@test.com',
      password: 'password123'
    });

    const authToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Logged in successfully');

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Get sender account info
    const accountResponse = await axios.get(`${API_BASE_URL}/account/details`, { headers });
    const senderAccount = accountResponse.data.data.account.accountNumber;
    console.log(`💰 Sender: ${senderAccount}, Balance: GHS ${accountResponse.data.data.account.balance}`);

    // Get a recipient account
    const mongoose = await import('mongoose');
    await mongoose.default.connect(process.env.MONGODB_URI);
    const Account = (await import('../src/models/Account.js')).default;
    
    const recipientAccount = await Account.findOne({ 
      accountNumber: { $ne: senderAccount } 
    });
    
    if (!recipientAccount) {
      console.log('❌ No recipient account found');
      return;
    }

    console.log(`🎯 Recipient: ${recipientAccount.accountNumber}`);

    await mongoose.default.connection.close();

    // Test transfer
    console.log('\n🔄 Testing transfer...');
    try {
      const transferResponse = await axios.post(`${API_BASE_URL}/account/transfer`, {
        recipientAccountNumber: recipientAccount.accountNumber,
        amount: 10.00,
        description: 'Simple test transfer'
      }, { 
        headers,
        timeout: 15000 // 15 second timeout
      });

      console.log('✅ Transfer successful!');
      console.log('Message:', transferResponse.data.message);
      console.log('New balance:', transferResponse.data.data.newBalance);
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Transfer failed with response:');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data?.message);
        console.log('Error:', error.response.data?.error);
      } else if (error.code === 'ECONNABORTED') {
        console.log('❌ Transfer timed out - server might be stuck');
      } else {
        console.log('❌ Transfer error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

simpleTransferTest();