import axios from 'axios';

let checkCount = 0;

const monitorServer = async () => {
  const checkInterval = setInterval(async () => {
    checkCount++;
    try {
      const response = await axios.get('http://localhost:5000/api/health', { timeout: 3000 });
      console.log(`✅ [${checkCount}] Server is healthy: ${response.data.message}`);
    } catch (error) {
      console.log(`❌ [${checkCount}] Server is down: ${error.message}`);
      if (checkCount >= 10) {
        clearInterval(checkInterval);
        console.log('🛑 Stopping monitor after 10 failed checks');
      }
    }
  }, 2000); // Check every 2 seconds
};

console.log('🔍 Starting server monitor...');
monitorServer();