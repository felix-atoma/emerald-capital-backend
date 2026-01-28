// test-cloudinary-verify.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔐 Testing Cloudinary Credentials:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key exists:', !!process.env.CLOUDINARY_API_KEY);
console.log('API Secret exists:', !!process.env.CLOUDINARY_API_SECRET);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test with a simple ping
try {
  console.log('\n🔄 Testing Cloudinary connection...');
  
  // Try to get account usage (simple API call that doesn't require special permissions)
  const result = await cloudinary.api.usage();
  
  console.log('✅ Cloudinary connection SUCCESSFUL!');
  console.log('📊 Account Usage:');
  console.log('- Plan:', result.plan);
  console.log('- Credits used:', result.credits.usage);
  console.log('- Credits limit:', result.credits.limit);
  console.log('- Storage used:', result.media_limits.bytes_usage, 'bytes');
  
} catch (error) {
  console.error('\n❌ Cloudinary connection FAILED:');
  console.error('Error:', error.message);
  
  if (error.message.includes('Invalid api_key')) {
    console.error('\n💡 SOLUTION:');
    console.error('1. Your API Key or Secret is incorrect');
    console.error('2. Go to Cloudinary Dashboard → Account Details');
    console.error('3. Copy the correct API Key and API Secret');
    console.error('4. Update your .env file');
  }
}