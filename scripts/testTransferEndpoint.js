import axios from 'axios';

const testTransferEndpoint = async () => {
  try {
    console.log('🔍 Testing if transfer endpoint is accessible...');
    
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running:', response.data.message);
    
    // Try to access transfer endpoint with OPTIONS to check if it exists
    try {
      const optionsResponse = await axios.options('http://localhost:5000/api/account/transfer');
      console.log('✅ Transfer endpoint exists (OPTIONS request succeeded)');
    } catch (optionsError) {
      console.log('❌ Transfer endpoint OPTIONS failed:', optionsError.message);
    }
    
  } catch (error) {
    console.error('❌ Server not accessible:', error.message);
  }
};

testTransferEndpoint();