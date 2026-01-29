// debug-admin-login-details.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function debugAdminLogin() {
  try {
    console.log('🔍 Debugging admin login endpoint...\n');
    
    // Test 1: Try with working adminuser
    console.log('1️⃣ Testing with adminuser (should work):');
    const adminUserResponse = await axios.post(`${API_BASE_URL}/api/admin/login`, {
      username: 'adminuser',
      password: 'admin123'
    });
    console.log('   Status:', adminUserResponse.status);
    console.log('   Success:', adminUserResponse.data.success);
    console.log('   Message:', adminUserResponse.data.message);
    console.log('   Token exists:', !!adminUserResponse.data.data?.tokens?.access);
    console.log();
    
    // Test 2: Try with EmeraldAdmin
    console.log('2️⃣ Testing with EmeraldAdmin (failing):');
    try {
      const emeraldResponse = await axios.post(`${API_BASE_URL}/api/admin/login`, {
        username: 'EmeraldAdmin',
        password: 'Emerald@Admin1&$'
      });
      console.log('   Status:', emeraldResponse.status);
      console.log('   Success:', emeraldResponse.data.success);
      console.log('   Message:', emeraldResponse.data.message);
    } catch (error) {
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data);
    }
    console.log();
    
    // Test 3: Check if endpoint exists
    console.log('3️⃣ Checking endpoint availability:');
    try {
      const health = await axios.get(`${API_BASE_URL}/api/admin/health`);
      console.log('   Admin health endpoint:', health.status);
    } catch (error) {
      console.log('   Admin health endpoint:', error.response?.status || 'Not found');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugAdminLogin();