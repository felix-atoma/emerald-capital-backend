// test-blog-stats-endpoint.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Change to your actual URL

async function testBlogStats() {
  console.log('🧪 Testing Blog Stats Endpoint\n');
  console.log('='.repeat(50));

  try {
    // 1. Login first
    console.log('1️⃣ Logging in as admin...');
    const loginRes = await axios.post(`${API_BASE_URL}/api/admin/login`, {
      username: 'adminuser',
      password: 'admin123'
    }, { timeout: 5000 });

    const token = loginRes.data.data.tokens.access;
    console.log('   ✅ Login successful');
    console.log(`   Token: ${token.substring(0, 30)}...\n`);

    // 2. Test the new blog stats endpoint
    console.log('2️⃣ Testing /api/admin/blogs/stats endpoint...');
    const statsRes = await axios.get(`${API_BASE_URL}/api/admin/blogs/stats`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('   ✅ Blog stats endpoint working!');
    console.log(`   Status: ${statsRes.status}`);
    console.log(`   Success: ${statsRes.data.success}\n`);

    // 3. Display the stats
    const stats = statsRes.data.data;
    console.log('📊 BLOG STATISTICS:');
    console.log('   Total blogs:', stats.stats.total);
    console.log('   Published:', stats.stats.published);
    console.log('   Drafts:', stats.stats.drafts);
    console.log('   Featured:', stats.stats.featured);
    console.log('   This month:', stats.stats.currentMonth);
    console.log('   Last month:', stats.stats.lastMonth);
    console.log('   Growth:', stats.stats.growth + '%\n');

    // 4. Display categories
    if (stats.categories && stats.categories.length > 0) {
      console.log('🏷️ CATEGORIES:');
      stats.categories.forEach(cat => {
        console.log(`   ${cat.name}: ${cat.count}`);
      });
      console.log('');
    }

    // 5. Test dashboard still works
    console.log('3️⃣ Testing /api/admin/dashboard (should still work)...');
    const dashboardRes = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log('   ✅ Dashboard endpoint still working!');
    console.log(`   Status: ${dashboardRes.status}\n`);

    console.log('='.repeat(50));
    console.log('🎉 ALL TESTS PASSED! Blog stats endpoint is fully functional!');

  } catch (error) {
    console.error('\n❌ Test failed!');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   Cannot connect to server. Is your backend running?');
      console.log(`   Trying to connect to: ${API_BASE_URL}`);
    } else if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data?.message || error.message);
      
      if (error.response.status === 404) {
        console.log('\n💡 Endpoint not found. Make sure:');
        console.log('   1. You added getBlogStats to adminController.js');
        console.log('   2. You added the route in adminRoutes.js');
        console.log('   3. You restarted your server');
      } else if (error.response.status === 401) {
        console.log('\n💡 Authentication failed. Check your admin credentials.');
      }
    } else if (error.request) {
      console.log('   No response received from server.');
    } else {
      console.log('   Error:', error.message);
    }
  }
}

// Run the test
testBlogStats();