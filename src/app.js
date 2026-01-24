import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';
import errorHandler from './middleware/errorHandler.js';
import connectDB from './config/database.js'; // Add database connection

// Import routes
import authRoutes from './routes/authRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import accountRoutes from './routes/account.js';
import blogRoutes from './routes/blogRoutes.js'; // Add blog routes
import categoryRoutes from './routes/categoryRoutes.js'; // Optional: Category routes
import uploadRoutes from './routes/uploadRoutes.js'; // Optional: File upload routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", config.clientUrl || 'http://localhost:3000'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
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
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.clientUrl || 'http://localhost:3000',
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
  parameterLimit: 10000 // Increase parameter limit for complex forms
}));

// Static files - ensure proper MIME types
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
    }
  }
}));

// Static files for blog images
app.use('/blog-images', express.static(path.join(__dirname, '../uploads/blog-images')));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  // In production, log only errors and important info
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

// Health check and system status route
app.get('/api/health', publicLimiter, (req, res) => {
  const healthCheck = {
    success: true,
    message: 'Emerald Capital Backend is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    database: 'connected', // You can add actual DB check here
  };
  res.status(200).json(healthCheck);
});

// System info route (for admin only)
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

// Public API routes (no authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Protected API routes (authentication middleware will be applied in routes)
app.use('/api/loans', loanRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);

// Blog routes - Apply optional auth for public access
app.use('/api/blogs', blogRoutes);

// Optional additional routes
app.use('/api/categories', categoryRoutes); // For managing blog categories
app.use('/api/upload', uploadRoutes); // For file uploads

// Serve static files in production
if (config.nodeEnv === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/build');
  
  // Check if client build exists
  app.use(express.static(clientBuildPath, {
    maxAge: '1d', // Cache static files for 1 day
    setHeaders: (res, path) => {
      // Cache static assets longer
      if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
        res.set('Cache-Control', 'public, max-age=86400'); // 1 day
      }
    }
  }));

  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Don't serve HTML for API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Don't serve HTML for file extensions
    if (req.path.match(/\.[a-zA-Z0-9]{2,5}$/)) {
      return next();
    }
    
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
  });
}

// Handle 404 - Route not found
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
  // Don't exit in production, log and continue
  if (config.nodeEnv === 'production') {
    // Send alert to monitoring service
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging or alerting here
});

export default app;