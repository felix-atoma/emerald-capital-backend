import dotenv from 'dotenv';

// Load .env file variables into process.env
dotenv.config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/emerald-capital',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    expire: process.env.JWT_EXPIRE || '30d',
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
  },

  // File Upload Configuration
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },

  // CORS Configuration - FIXED
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL || 'https://emerald-capital-u8zr.vercel.app'
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5174',
          process.env.CLIENT_URL || 'https://emerald-capital-u8zr.vercel.app'
        ],
    credentials: true,
    optionsSuccessStatus: 200
  },
};

export default config;