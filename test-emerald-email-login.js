// test-emerald-email-login.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testEmailLogin() {
  try {
    console.log('🔐 Testing login with EMAIL instead of username...\n');
    
    // Try with email (admin@emerald.com) instead of username
    const credentials = {
      username: 'admin@emerald.com',  // Using EMAIL as username
      password: 'Emerald@Admin1&$'
    };
    
    console.log('📤 Sending to /api/admin/login');
    console.log('Using email as username:', credentials);
    
    const response = await axios.post(`${API_BASE_URL}/api/admin/login`, credentials);
    
    console.log('\n✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('\n❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.message);
    
    console.log('\n💡 Try this in your frontend:');
    console.log('Use email "admin@emerald.com" instead of username "EmeraldAdmin"');
  }
}

testEmailLogin();