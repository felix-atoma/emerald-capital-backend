import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔍 Looking for config file...');
    
    // Try different possible config paths
    const possiblePaths = [
      '../src/config/config.js',
      '../config/config.js', 
      './config/config.js'
    ];
    
    let config;
    let configPath;
    
    for (const configPath of possiblePaths) {
      try {
        const fullPath = path.join(__dirname, configPath);
        console.log(`Trying: ${fullPath}`);
        config = (await import(fullPath)).default;
        console.log(`✅ Found config at: ${configPath}`);
        break;
      } catch (error) {
        console.log(`❌ Not found: ${configPath}`);
      }
    }
    
    if (!config) {
      // Use direct environment variable as fallback
      console.log('🔄 Using environment variables directly...');
      const mongodbUri = process.env.MONGODB_URI || 'mongodb+srv://felixatoma2:yvaPR1cxDGkMQxG2@cluster0.wllhjbf.mongodb.net/nashma?retryWrites=true&w=majority&appName=Cluster0';
      
      console.log('Testing connection to MongoDB...');
      console.log('URI:', mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
      
      await mongoose.connect(mongodbUri);
      console.log('✅ MongoDB connection successful!');
    } else {
      // Use config file
      const mongodbUri = config.database?.uri || process.env.MONGODB_URI;
      
      console.log('Testing connection to MongoDB...');
      console.log('URI:', mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
      
      await mongoose.connect(mongodbUri);
      console.log('✅ MongoDB connection successful!');
    }
    
    // Test if we can access collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections in database:`);
    
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    await mongoose.connection.close();
    console.log('🔒 Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n💡 Check your MongoDB URI in .env file or config.js');
    process.exit(1);
  }
};

testConnection();