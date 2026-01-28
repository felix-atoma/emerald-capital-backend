import { v2 as cloudinary } from 'cloudinary';
import config from './config.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true
});

// Test Cloudinary connection
if (config.cloudinary.cloudName && config.cloudinary.apiKey) {
  console.log('🌥️  Cloudinary configured');
} else {
  console.warn('⚠️  Cloudinary credentials not found. Uploads will fail.');
}

export default cloudinary;