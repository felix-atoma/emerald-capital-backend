import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testFixedTransfer = async () => {
  console.log('🧪 Testing Fixed Transfer Controller');
  console.log('='.repeat(40));

  try {
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'john.doe@test.com',
      password: 'password123'
    }, { timeout: 5000 });

    const authToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Logged in successfully');

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Test transfer to the emergency account
    console.log('\n🔄 Testing transfer to emergency account...');
    
    const transferData = {
      recipientAccountNumber: 'EMERG1760209998937v3y6g',
      amount: 10.00,
      description: 'Test fixed transfer'
    };

    const transferResponse = await axios.post(
      'http://localhost:5000/api/account/transfer', 
      transferData, 
      { 
        headers,
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('🎉 Transfer successful!');
    console.log('Message:', transferResponse.data.message);
    console.log('New balance:', transferResponse.data.data.newBalance);

  } catch (error) {
    console.log('❌ Test failed:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data?.message);
      console.log('Error:', error.response.data?.error);
    } else if (error.code === 'ECONNABORTED') {
      console.log('Request timed out - server might be stuck');
    } else {
      console.log('Error:', error.message);
    }
  }
};

testFixedTransfer();