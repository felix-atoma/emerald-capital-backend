import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // Add this import
import config from './config/config.js';
import errorHandler from './middleware/errorHandler.js';
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import accountRoutes from './routes/account.js';
import blogRoutes from './routes/blogRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:', "'self' /uploads/"],
        connectSrc: ["'self'", config.clientUrl || 'http://localhost:3000'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public endpoints with higher limits
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.clientUrl || 'http://localhost:3000',
      'http://localhost:5173', // Add Vite dev server
      'https://emeraldcapital.com',
      'https://www.emeraldcapital.com',
    ];
    
    if (allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['Content-Disposition'],
};

app.use(cors(corsOptions));

// Preflight requests
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 10000
}));

// Static files - serve from correct directory
const staticOptions = {
  setHeaders: (res, filePath) => {
    // Set proper content types
    if (filePath.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
    }
    
    // Cache static files
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|css|js)$/)) {
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
  }
};

// Serve uploads from the correct path
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));

// Also serve from root for backward compatibility
app.use('/blog-images', express.static(path.join(__dirname, 'uploads/blog-images'), staticOptions));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  morgan.token('error-message', (req, res) => res.statusMessage);
  app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// Request logging middleware
app.use((req, res, next) => {
  if (config.nodeEnv === 'development') {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

// Health check
app.get('/api/health', publicLimiter, (req, res) => {
  const healthCheck = {
    success: true,
    message: 'Emerald Capital Backend is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    database: 'connected',
  };
  res.status(200).json(healthCheck);
});

// System info route
app.get('/api/system-info', apiLimiter, (req, res) => {
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    env: config.nodeEnv,
    pid: process.pid,
    uptime: process.uptime(),
  };
  res.status(200).json({
    success: true,
    data: systemInfo,
  });
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Public API routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Protected API routes
app.use('/api/loans', loanRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes); // Make sure this is included

// Serve static files in production
if (config.nodeEnv === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/build');
  
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
          res.set('Cache-Control', 'public, max-age=86400');
        }
      }
    }));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      if (req.path.match(/\.[a-zA-Z0-9]{2,5}$/)) {
        return next();
      }
      
      res.sendFile(path.resolve(clientBuildPath, 'index.html'));
    });
  }
}

// Handle 404
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this server`,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: 'Check the API documentation or ensure the endpoint exists',
  });
});

// Global error handling middleware
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;