import dotenv from 'dotenv';

// Load .env file variables into process.env
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    uri: process.env.MONGODB_URI || 'MONGODB_URI=mongodb+srv://felixatoma2:yvaPR1cxDGkMQxG2@cluster0.wllhjbf.mongodb.net/nashma?retryWrites=true&w=majority&appName=Cluster0&connectTimeoutMS=10000&socketTimeoutMS=30000&serverSelectionTimeoutMS=5000&maxPoolSize=15',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    expire: process.env.JWT_EXPIRE || '30d',
  },

  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
  },

  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'emerald_capital',
  },

  // Upload configuration (for local fallback if needed)
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'webp', 'svg'],
  },

  // ✅ Updated CORS configuration
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      'https://emerald-capital-u8zr.vercel.app',
      'https://emerald-capital.netlify.app',
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
    optionsSuccessStatus: 200,
  },
};

export default config;