import axios from 'axios';

const checkServer = async () => {
  try {
    console.log('🔍 Checking server status...');
    
    const response = await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
    console.log('✅ Server is running:', response.data.message);
    
    // Test if transfer endpoint is accessible
    try {
      const transferCheck = await axios.options('http://localhost:5000/api/account/transfer', { timeout: 5000 });
      console.log('✅ Transfer endpoint is accessible');
    } catch (error) {
      console.log('❌ Transfer endpoint not accessible:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Server not accessible:', error.message);
    console.log('💡 Make sure the server is running with: pnpm run dev');
  }
};

checkServer();