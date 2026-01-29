// test-emerald-login.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testEmeraldAdminLogin() {
  try {
    console.log('🔐 Testing EmeraldAdmin login...\n');
    
    const credentials = {
      username: 'EmeraldAdmin',
      password: 'Emerald@Admin1&$'
    };
    
    console.log('📤 Sending to /api/admin/login');
    console.log('Credentials:', credentials);
    
    const response = await axios.post(`${API_BASE_URL}/api/admin/login`, credentials);
    
    console.log('\n✅ Login successful!');
    console.log('Response status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Token received:', !!response.data.data?.tokens?.access);
    
    if (response.data.data?.tokens?.access) {
      console.log('\n🔑 Token (first 50 chars):', 
        response.data.data.tokens.access.substring(0, 50) + '...');
    }
    
  } catch (error) {
    console.error('\n❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message);
    console.log('Full error:', error.response?.data);
  }
}

testEmeraldAdminLogin();