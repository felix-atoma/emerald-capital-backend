// test-fixed-emerald-login.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testFixedLogin() {
  console.log('🧪 Testing EmeraldAdmin login after fix...\n');
  
  const testCases = [
    { username: 'EmeraldAdmin', description: 'Original case' },
    { username: 'emeraldadmin', description: 'Lowercase' },
    { username: 'EMERALDADMIN', description: 'Uppercase' },
    { username: ' EmeraldAdmin ', description: 'With spaces' }
  ];
  
  for (const test of testCases) {
    try {
      console.log(`🔐 Test: ${test.description}`);
      console.log(`   Username: "${test.username}"`);
      
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, {
        username: test.username,
        password: 'Emerald@Admin1&$'
      }, { timeout: 5000 });
      
      console.log(`   ✅ SUCCESS! Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Token received: ${!!response.data.data?.tokens?.access}\n`);
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.response?.data?.message || error.message}\n`);
    }
  }
}

// Also test adminuser to ensure we didn't break it
async function testAdminUser() {
  console.log('\n🔐 Testing adminuser (should still work)...\n');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/admin/login`, {
      username: 'adminuser',
      password: 'admin123'
    });
    
    console.log(`   ✅ SUCCESS! Status: ${response.status}`);
    console.log(`   Message: ${response.data.message}\n`);
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.response?.data?.message || error.message}\n`);
  }
}

async function runTests() {
  await testFixedLogin();
  await testAdminUser();
}

runTests();