import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from './config/config.js';
import errorHandler from './middleware/errorHandler.js';
import connectDB from './config/database.js';

// Import AI routes - COMMENTED OUT
// import aiRoutes from './routes/ai.routes.js';

// Import other routes
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

// Create blog-images subdirectory
const blogImagesDir = path.join(uploadsDir, 'blog-images');
if (!fs.existsSync(blogImagesDir)) {
  fs.mkdirSync(blogImagesDir, { recursive: true });
  console.log('📁 Created blog-images directory');
}

// Create assets directory for static files
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('📁 Created assets directory');
}

// ==================== SECURITY & CORS CONFIGURATION ====================

// 1. HELMET CONFIGURATION
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://emeraldcapitalgh.com',
          'http://emeraldcapitalgh.com',
          'https://emeraldcapital.com',
          'http://emeraldcapital.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:', '*'],
        connectSrc: ["'self'", 'ws://localhost:*', ...config.cors.origin],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS CONFIGURATION
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) {
      return callback(null, true);
    }

    // Always allow in development
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }

    // Check if origin is allowed
    const allowedOrigins = config.cors.origin;
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: config.cors.credentials,
  optionsSuccessStatus: config.cors.optionsSuccessStatus,
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
  ],
  preflightContinue: false,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 3. STATIC FILES CORS MIDDLEWARE
app.use((req, res, next) => {
  const isStaticFile = req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$/);
  
  if (isStaticFile) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
});

// ==================== RATE LIMITING ====================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/uploads/') || req.path.startsWith('/assets/'),
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  skip: (req) => req.path.startsWith('/uploads/') || req.path.startsWith('/assets/'),
});

// COMMENT OUT AI LIMITER since we're disabling AI
// const aiLimiter = rateLimit({
//   windowMs: config.ai.rateLimit.windowMs,
//   max: config.ai.rateLimit.max,
//   message: {
//     success: false,
//     message: 'AI rate limit exceeded. Please try again later.',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// ==================== BODY PARSING ====================

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

// ==================== LOGGING ====================

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400,
  }));
}

// Request info logging middleware
app.use((req, res, next) => {
  if (config.nodeEnv === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No Origin'}`);
  }
  next();
});

// ==================== STATIC FILE SERVING ====================

const staticOptions = {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
    
    if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};

// Serve uploads directory
app.use('/uploads', express.static(uploadsDir, staticOptions));

// Serve assets directory
app.use('/assets', express.static(assetsDir, staticOptions));

// ==================== DEBUG & DIAGNOSTIC ENDPOINTS ====================

// Health check endpoint
app.get('/api/health', publicLimiter, (req, res) => {
  const healthCheck = {
    success: true,
    message: 'Emerald Capital Backend is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cors: {
      enabled: true,
      origins: config.cors.origin.length,
    }
  };
  res.status(200).json(healthCheck);
});

// CORS Debug endpoint (for testing tool)
app.get('/api/debug/cors', publicLimiter, (req, res) => {
  const origin = req.headers.origin;
  const protocol = req.protocol;
  const host = req.headers.host;
  
  res.json({
    success: true,
    message: 'CORS Debug Information',
    requestInfo: {
      origin: origin || 'No Origin Header',
      protocol: protocol,
      host: host,
      userAgent: req.headers['user-agent'],
    },
    serverInfo: {
      environment: config.nodeEnv,
      port: config.port,
      nodeVersion: process.version,
    },
    corsConfig: {
      allowedOrigins: config.cors.origin,
      credentials: config.cors.credentials,
      staticFilesCors: 'enabled',
    },
    staticFiles: {
      uploadsUrl: `${protocol}://${host}/uploads/`,
      assetsUrl: `${protocol}://${host}/assets/`,
      blogImagesUrl: `${protocol}://${host}/uploads/blog-images/`,
    }
  });
});

// Uploads Check endpoint (for testing tool)
app.get('/api/debug/uploads', publicLimiter, (req, res) => {
  try {
    const directories = [
      { name: 'uploads', path: uploadsDir },
      { name: 'blog-images', path: blogImagesDir },
      { name: 'assets', path: assetsDir },
    ];
    
    const results = directories.map(dir => {
      const exists = fs.existsSync(dir.path);
      const files = exists ? fs.readdirSync(dir.path) : [];
      const stats = exists ? fs.statSync(dir.path) : null;
      
      return {
        name: dir.name,
        path: dir.path,
        exists: exists,
        fileCount: files.length,
        files: files.slice(0, 10),
        totalFiles: files.length,
        size: stats ? `${(stats.size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
      };
    });
    
    // Create a test file if it doesn't exist
    const testFilePath = path.join(uploadsDir, 'test-cors.txt');
    if (!fs.existsSync(testFilePath)) {
      fs.writeFileSync(testFilePath, 'This is a test file for CORS verification.\nUploads directory is working correctly.');
    }
    
    res.json({
      success: true,
      message: 'Uploads directory check',
      timestamp: new Date().toISOString(),
      directories: results,
      testFiles: {
        textFile: `${req.protocol}://${req.headers.host}/uploads/test-cors.txt`,
      },
      instructions: 'Try accessing the test files to verify CORS is working',
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking uploads directory',
      error: error.message,
      stack: config.nodeEnv === 'development' ? error.stack : undefined,
    });
  }
});

// System Info endpoint
app.get('/api/system/info', apiLimiter, (req, res) => {
  const systemInfo = {
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      pid: process.pid,
      environment: config.nodeEnv,
    },
    process: {
      cwd: process.cwd(),
      versions: process.versions,
    },
    directories: {
      root: __dirname,
      uploads: uploadsDir,
      assets: assetsDir,
      blogImages: blogImagesDir,
    },
    config: {
      port: config.port,
      clientUrl: config.clientUrl,
      corsOrigins: config.cors.origin,
      // aiServices: config.getAvailableAIServices(), // COMMENTED OUT AI
    },
  };
  
  res.status(200).json({
    success: true,
    data: systemInfo,
  });
});

// Quick Test endpoint
app.get('/api/test/quick', publicLimiter, (req, res) => {
  res.json({
    success: true,
    message: 'Quick test endpoint',
    endpoints: {
      health: '/api/health',
      corsDebug: '/api/debug/cors',
      uploadsCheck: '/api/debug/uploads',
      systemInfo: '/api/system/info',
    },
    server: {
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    instructions: 'Use these endpoints to verify server functionality',
  });
});

// COMMENT OUT AI Status endpoint
// app.get('/api/ai/status', publicLimiter, (req, res) => {
//   const aiStatus = config.getAIServiceStatus();
  
//   res.json({
//     success: true,
//     ai: aiStatus,
//     configuration: {
//       defaultService: config.ai.defaultService,
//       temperature: config.ai.temperature,
//       maxTokens: config.ai.maxTokens,
//       rateLimit: config.ai.rateLimit,
//     },
//     services: {
//       openai: {
//         configured: !!config.openai.apiKey,
//         model: config.openai.model,
//         maxTokens: config.openai.maxTokens,
//       },
//       gemini: {
//         configured: !!config.gemini.apiKey,
//         model: config.gemini.model,
//       },
//       claude: {
//         configured: !!config.claude.apiKey,
//         model: config.claude.model,
//         maxTokens: config.claude.maxTokens,
//       },
//     },
//     mockResponses: config.mockResponses,
//   });
// });

// Cloudinary Config endpoint (for testing tool)
app.get('/api/upload/config', publicLimiter, (req, res) => {
  res.json({
    success: true,
    data: {
      cloudinary: {
        configured: !!(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret),
        cloud_name: config.cloudinary.cloudName || null,
        api_key: config.cloudinary.apiKey ? '••••' + config.cloudinary.apiKey.slice(-4) : null,
        upload_preset: config.cloudinary.uploadPreset,
      },
      upload: {
        path: config.upload.path,
        maxFileSize: config.upload.maxFileSize,
        allowedImageTypes: config.upload.allowedImageTypes,
        allowedFileTypes: config.upload.allowedFileTypes,
      }
    }
  });
});

// ==================== API ROUTES ====================

// Apply rate limiting to API routes
app.use('/api', apiLimiter);
// COMMENT OUT AI rate limiting
// app.use('/api/ai', aiLimiter);

// Public API routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
// COMMENT OUT AI routes
// app.use('/api/ai', aiRoutes);

// Protected API routes
app.use('/api/loans', loanRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);

// ==================== ADMIN DASHBOARD ENDPOINT ====================

// Add this dashboard endpoint if your adminRoutes doesn't have it
app.get('/api/admin/dashboard/stats', apiLimiter, async (req, res) => {
  try {
    // Import models
    const User = (await import('./models/User.js')).default;
    const Loan = (await import('./models/Loan.js')).default;
    const Blog = (await import('./models/Blog.js')).default;
    const Contact = (await import('./models/Contact.js')).default;
    
    // Get counts
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      totalLoans,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      recentContacts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ 
        createdAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        } 
      }),
      Loan.countDocuments(),
      Loan.countDocuments({ status: 'pending' }),
      Loan.countDocuments({ status: 'approved' }),
      Loan.countDocuments({ status: 'rejected' }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Blog.countDocuments({ status: 'draft' }),
      Contact.countDocuments({
        createdAt: { 
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        }
      }),
    ]);
    
    // Get loan amount total
    const loanAmountAgg = await Loan.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    
    // Get blog views total
    const blogViewsAgg = await Blog.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    
    const dashboardStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        growth: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
      },
      loans: {
        total: totalLoans,
        pending: pendingLoans,
        approved: approvedLoans,
        rejected: rejectedLoans,
        totalAmount: loanAmountAgg[0]?.totalAmount || 0
      },
      blogs: {
        total: totalBlogs,
        published: publishedBlogs,
        drafts: draftBlogs,
        views: blogViewsAgg[0]?.totalViews || 0
      },
      activity: {
        contactMessages: recentContacts,
        timestamp: new Date().toISOString()
      }
    };
    
    res.json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: dashboardStats
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    
    // Return fallback data on error
    res.json({
      success: true,
      message: 'Dashboard statistics (using fallback)',
      data: {
        users: { total: 0, active: 0, newToday: 0, growth: 0 },
        loans: { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 },
        blogs: { total: 0, published: 0, drafts: 0, views: 0 },
        activity: { contactMessages: 0 },
        note: 'Using fallback data due to database error'
      },
      warning: 'Could not fetch real-time statistics'
    });
  }
});

// ==================== CLIENT SPA SERVING ====================

if (config.nodeEnv === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/build');
  
  if (fs.existsSync(clientBuildPath)) {
    console.log(`🚀 Serving client build from: ${clientBuildPath}`);
    
    app.use(express.static(clientBuildPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        
        if (filePath.match(/\.(js|css)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || 
          req.path.startsWith('/uploads/') || 
          req.path.startsWith('/assets/')) {
        return next();
      }
      
      if (req.path.match(/\.[a-zA-Z0-9]{2,5}$/)) {
        return next();
      }
      
      res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          next(err);
        }
      });
    });
  } else {
    console.log('⚠️  Client build directory not found:', clientBuildPath);
  }
}

// ==================== ERROR HANDLING ====================

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString(),
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      origin: req.headers.origin,
      protocol: req.protocol,
    },
    availableEndpoints: {
      api: '/api/*',
      static: ['/uploads/*', '/assets/*'],
      health: '/api/health',
      debug: '/api/debug/cors',
    },
  });
});

// Global error handler
app.use(errorHandler);

// ==================== SERVER STARTUP LOG ====================

app.on('listening', () => {
  console.log('\n✅ Emerald Capital Server Started!');
  console.log('📊 Available endpoints:');
  console.log(`   Health Check: http://localhost:${config.port}/api/health`);
  console.log(`   CORS Debug: http://localhost:${config.port}/api/debug/cors`);
  console.log(`   Uploads Check: http://localhost:${config.port}/api/debug/uploads`);
  console.log(`   System Info: http://localhost:${config.port}/api/system/info`);
  // COMMENT OUT AI endpoints from startup log
  // console.log(`   AI Status: http://localhost:${config.port}/api/ai/status`);
  console.log(`   Cloudinary Config: http://localhost:${config.port}/api/upload/config`);
  console.log(`   Admin Dashboard: http://localhost:${config.port}/api/admin/dashboard/stats`);
});

// ==================== EXPORT ====================

export default app;