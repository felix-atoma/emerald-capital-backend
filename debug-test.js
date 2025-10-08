// debug-test.js
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function debugLogin() {
  try {
    const testData = {
      username: 'testuser',
      password: 'test123456'
    };

    console.log('Sending login request with:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/auth/login`, testData);
    console.log('✅ Login successful:', response.data);
    
    return response.data.data.tokens.access;
  } catch (error) {
    console.log('❌ Login failed:');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message);
    console.log('Full error:', error.response?.data);
    return null;
  }
}

async function testProtectedRoute(token) {
  if (!token) return;
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Profile access successful:', response.data);
  } catch (error) {
    console.log('❌ Profile access failed:');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message);
  }
}

async function runDebug() {
  console.log('🔍 Debugging authentication...\n');
  
  const token = await debugLogin();
  await testProtectedRoute(token);
}

runDebug();