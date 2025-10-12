import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

const debugTransfer = async () => {
  try {
    // First, login to get token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'john.doe@test.com',
      password: 'password123'
    });

    const authToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Logged in successfully');

    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Get account details
    const accountResponse = await api.get('/account/details');
    const currentAccount = accountResponse.data.data.account.accountNumber;
    console.log(`💰 Current account: ${currentAccount}`);
    console.log(`💵 Current balance: GHS ${accountResponse.data.data.account.balance}`);

    // Try transfer with different scenarios

    // Scenario 1: Transfer to self (should fail)
    console.log('\n🔍 Testing transfer to self...');
    try {
      const selfTransfer = await api.post('/account/transfer', {
        recipientAccountNumber: currentAccount,
        amount: 10.00,
        description: 'Test self transfer'
      });
      console.log('❌ Self transfer should have failed but succeeded');
    } catch (error) {
      console.log('✅ Self transfer correctly failed:', error.response?.data?.message);
    }

    // Scenario 2: Transfer to invalid account
    console.log('\n🔍 Testing transfer to invalid account...');
    try {
      const invalidTransfer = await api.post('/account/transfer', {
        recipientAccountNumber: 'INVALID_ACCOUNT_123',
        amount: 10.00,
        description: 'Test invalid transfer'
      });
      console.log('❌ Invalid transfer should have failed but succeeded');
    } catch (error) {
      console.log('✅ Invalid transfer correctly failed:', error.response?.data?.message);
    }

    // Scenario 3: Transfer with insufficient funds
    console.log('\n🔍 Testing transfer with insufficient funds...');
    try {
      const largeTransfer = await api.post('/account/transfer', {
        recipientAccountNumber: 'GH9999999999', // Some other account
        amount: 10000.00,
        description: 'Test large transfer'
      });
      console.log('❌ Large transfer should have failed but succeeded');
    } catch (error) {
      console.log('✅ Large transfer correctly failed:', error.response?.data?.message);
    }

    // Scenario 4: Find another valid account to transfer to
    console.log('\n🔍 Looking for another account to test with...');
    const allAccountsResponse = await axios.get(`${API_BASE_URL}/admin/accounts`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).catch(() => ({ data: { data: [] } }));

    if (allAccountsResponse.data.data.length > 1) {
      const otherAccount = allAccountsResponse.data.data.find(acc => acc.accountNumber !== currentAccount);
      if (otherAccount) {
        console.log(`🔍 Found another account: ${otherAccount.accountNumber}`);
        
        // Scenario 5: Valid transfer
        console.log('\n🔍 Testing valid transfer...');
        try {
          const validTransfer = await api.post('/account/transfer', {
            recipientAccountNumber: otherAccount.accountNumber,
            amount: 50.00,
            description: 'Test valid transfer'
          });
          console.log('✅ Valid transfer succeeded:', validTransfer.data.message);
          console.log('New balance:', validTransfer.data.data.newBalance);
        } catch (error) {
          console.log('❌ Valid transfer failed:', error.response?.data?.message);
          console.log('Error details:', error.response?.data);
        }
      } else {
        console.log('ℹ️ No other accounts found for testing');
      }
    } else {
      console.log('ℹ️ Only one account exists, cannot test transfers');
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