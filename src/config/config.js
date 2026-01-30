import dotenv from 'dotenv';

// Load .env file variables into process.env
dotenv.config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Database
  database: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://felixatoma2:yvaPR1cxDGkMQxG2@cluster0.wllhjbf.mongodb.net/nashma?retryWrites=true&w=majority&appName=Cluster0&connectTimeoutMS=10000&socketTimeoutMS=30000&serverSelectionTimeoutMS=5000&maxPoolSize=15',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    expire: process.env.JWT_EXPIRE || '30d',
  },

  // Email
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
  },

  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'emerald_capital',
  },

  // Upload configuration
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'webp', 'svg'],
  },

  // CORS configuration
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      'https://emerald-capital-u8zr.vercel.app',
      'https://emerald-capital.netlify.app',
      'https://emeraldcapitalgh.com',
      'https://www.emeraldcapitalgh.com',
      ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []),
    ].filter(Boolean),
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // ========== AI CONFIGURATION ==========
  ai: {
    defaultService: process.env.AI_DEFAULT_SERVICE || 'openai',
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2000,
    
    rateLimit: {
      windowMs: parseInt(process.env.AI_RATE_WINDOW) || 15 * 60 * 1000,
      max: parseInt(process.env.AI_RATE_MAX) || 100,
    },
    
    credits: {
      enabled: process.env.AI_CREDITS_ENABLED === 'true' || false,
      defaultCredits: parseInt(process.env.AI_DEFAULT_CREDITS) || 100,
      costPerToken: parseFloat(process.env.AI_COST_PER_TOKEN) || 0.002,
    },
    
    limits: {
      maxContentLength: parseInt(process.env.AI_MAX_CONTENT_LENGTH) || 5000,
      minContentLength: parseInt(process.env.AI_MIN_CONTENT_LENGTH) || 100,
      maxKeywords: parseInt(process.env.AI_MAX_KEYWORDS) || 10,
    },
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    organization: process.env.OPENAI_ORGANIZATION,
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
    timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000,
  },

  // Google Gemini Configuration (Updated with latest model names)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    apiVersion: process.env.GEMINI_API_VERSION || 'v1beta',
    // List of available models to try if primary fails
    fallbackModels: ['gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'],
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE'
      }
    ],
  },

  // Anthropic Claude Configuration
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096,
    version: process.env.CLAUDE_VERSION || '2023-06-01',
    // Fallback models
    fallbackModels: [
      'claude-3-haiku-20240307',
      'claude-3-sonnet-20240229',
      'claude-3-opus-20240229'
    ],
  },

  // Payment
  payment: {
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  },
  
  // Mock responses for development (when no API keys are available)
  mockResponses: {
    enabled: process.env.USE_MOCK_AI === 'true' || false,
    delay: parseInt(process.env.MOCK_AI_DELAY) || 1000,
  }
};

// Helper functions
config.getAIServiceStatus = function() {
  const status = {
    openai: {
      available: !!this.openai.apiKey,
      model: this.openai.model,
      configured: !!this.openai.apiKey,
    },
    gemini: {
      available: !!this.gemini.apiKey,
      model: this.gemini.model,
      configured: !!this.gemini.apiKey,
    },
    claude: {
      available: !!this.claude.apiKey,
      model: this.claude.model,
      configured: !!this.claude.apiKey,
    },
    defaultService: this.ai.defaultService,
    anyAvailable: !!(this.openai.apiKey || this.gemini.apiKey || this.claude.apiKey),
    mockEnabled: this.mockResponses.enabled,
  };
  
  // Check if any service is both configured AND has valid billing/credits
  // This would require actual API testing, but we can at least check for key presence
  return status;
};

config.getAvailableAIServices = function() {
  const status = this.getAIServiceStatus();
  const services = [];
  
  if (status.openai.configured) services.push('openai');
  if (status.gemini.configured) services.push('gemini');
  if (status.claude.configured) services.push('claude');
  
  return services;
};

config.getAIServiceConfig = function(serviceName) {
  switch(serviceName) {
    case 'openai':
      return this.openai;
    case 'gemini':
      return this.gemini;
    case 'claude':
      return this.claude;
    default:
      return this[serviceName] || this.openai;
  }
};

// Validate configuration on startup
const validateConfig = () => {
  console.log('🔧 Configuration Validation:');
  console.log(`- Environment: ${config.nodeEnv}`);
  console.log(`- Port: ${config.port}`);
  console.log(`- Client URLs: ${config.clientUrl}`);
  console.log(`- Database: ${config.database.uri ? '✅ Configured' : '❌ Missing'}`);
  console.log(`- JWT Secret: ${config.jwt.secret !== 'fallback_secret_key' ? '✅ Custom' : '⚠️ Default'}`);
  console.log(`- Email: ${config.email.username ? '✅ Configured' : '❌ Missing'}`);
  console.log(`- Cloudinary: ${config.cloudinary.cloudName ? '✅ Configured' : '❌ Missing'}`);
  
  console.log('\n🤖 AI Services Status:');
  const aiStatus = config.getAIServiceStatus();
  console.log(`- OpenAI: ${aiStatus.openai.configured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`- Gemini: ${aiStatus.gemini.configured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`- Claude: ${aiStatus.claude.configured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`- Default Service: ${aiStatus.defaultService}`);
  console.log(`- Mock Responses: ${aiStatus.mockEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  
  const availableServices = config.getAvailableAIServices();
  if (availableServices.length > 0) {
    console.log(`- Available Services: ${availableServices.join(', ')}`);
  } else {
    console.log('\n⚠️ WARNING: No AI API keys configured.');
    console.log('   AI features will not work without API keys.');
    console.log('   To enable mock responses for development, set USE_MOCK_AI=true in .env');
    console.log('   For production, add at least one AI service API key:');
    console.log('   - OPENAI_API_KEY from platform.openai.com');
    console.log('   - GEMINI_API_KEY from ai.google.dev');
    console.log('   - ANTHROPIC_API_KEY from console.anthropic.com');
  }
  
  // Check if default service is available
  if (availableServices.length > 0 && !availableServices.includes(aiStatus.defaultService)) {
    console.log(`\n⚠️ WARNING: Default AI service "${aiStatus.defaultService}" is not available.`);
    console.log(`   Falling back to: ${availableServices[0]}`);
  }
};

// Run validation
validateConfig();

export default config;