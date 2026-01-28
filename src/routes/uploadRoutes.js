import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; // ADD THIS
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';

const router = express.Router();

// Get the correct __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine project root - adjust based on your structure
// Since uploadRoutes.js is in src/routes/, go up two levels
const projectRoot = path.join(__dirname, '..', '..');

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const baseUploadPath = path.join(projectRoot, 'uploads');
  
  console.log('📁 Project root:', projectRoot);
  console.log('📁 Base upload path:', baseUploadPath);
  
  const directories = [
    'blog-images',
    'profiles',
    'documents',
    'general'
  ];
  
  // Create base uploads directory
  try {
    if (!fs.existsSync(baseUploadPath)) {
      fs.mkdirSync(baseUploadPath, { recursive: true });
      console.log(`✅ Created base upload directory: ${baseUploadPath}`);
    } else {
      console.log(`✅ Base upload directory already exists: ${baseUploadPath}`);
    }
    
    // Create subdirectories
    directories.forEach(subDir => {
      const dirPath = path.join(baseUploadPath, subDir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dirPath}`);
      } else {
        console.log(`✅ Directory already exists: ${dirPath}`);
      }
    });
  } catch (error) {
    console.error('❌ Error creating directories:', error.message);
    console.error('Full error:', error);
  }
};

// Create directories on startup
createUploadDirectories();

// Configure multer for file uploads - FIXED PATHS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'general/';
    
    if (req.query.type === 'blog') {
      subDir = 'blog-images/';
    } else if (req.query.type === 'profile') {
      subDir = 'profiles/';
    } else if (req.query.type === 'document') {
      subDir = 'documents/';
    }
    
    const uploadPath = path.join(projectRoot, 'uploads', subDir);
    
    // Ensure directory exists - create if not
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log(`📁 Created upload directory: ${uploadPath}`);
      }
      
      console.log(`📂 Uploading to: ${uploadPath}`);
      cb(null, uploadPath);
    } catch (error) {
      console.error('❌ Error creating upload directory:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // Clean filename and ensure unique name
    const originalName = path.parse(file.originalname).name;
    const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Create filename with prefix for easier identification
    let prefix = 'file';
    if (req.query.type === 'blog') prefix = 'image';
    if (req.query.type === 'profile') prefix = 'profile';
    if (req.query.type === 'document') prefix = 'doc';
    
    const filename = `${prefix}-${cleanName}-${uniqueSuffix}${ext}`;
    
    console.log(`📄 Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// File filter - allow only images for /image endpoint
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only image files are allowed (jpg, png, gif, webp, svg)!'));
  }
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: File type not supported!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

const imageUpload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: imageFileFilter
});

// Upload middleware with error handling
const handleUpload = (uploadMethod) => {
  return (req, res, next) => {
    uploadMethod(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File too large. Maximum size is 10MB'
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading file'
        });
      }
      
      // Log upload success
      if (req.file) {
        console.log(`✅ Upload successful: ${req.file.filename}`);
        console.log(`📁 Saved to: ${req.file.path}`);
        console.log(`📏 Size: ${req.file.size} bytes`);
      } else if (req.files) {
        console.log(`✅ Upload successful: ${req.files.length} files`);
        req.files.forEach(file => {
          console.log(`   - ${file.filename} (${file.size} bytes)`);
        });
      }
      
      next();
    });
  };
};

// Protected routes
router.use(authenticate);

// Upload single image (only images)
router.post('/image', handleUpload(imageUpload.single('image')), uploadImage);

// Upload multiple images (only images)
router.post('/images', handleUpload(imageUpload.array('images', 5)), uploadImage);

// Upload file (any allowed type)
router.post('/file', handleUpload(upload.single('file')), uploadImage);

// Delete image
router.delete('/image/:filename', authorize('admin', 'author'), deleteImage);

// Debug endpoint to check upload directories
router.get('/debug-dirs', (req, res) => {
  const basePath = path.join(projectRoot, 'uploads');
  
  console.log('🔍 Debugging directories...');
  console.log('Project root:', projectRoot);
  console.log('Base upload path:', basePath);
  console.log('Current working directory:', process.cwd());
  console.log('__dirname:', __dirname);
  
  try {
    const directories = ['blog-images', 'profiles', 'documents', 'general'];
    const result = {};
    
    directories.forEach(dir => {
      const dirPath = path.join(basePath, dir);
      const exists = fs.existsSync(dirPath);
      result[dir] = {
        path: dirPath,
        exists: exists,
        files: exists ? fs.readdirSync(dirPath) : []
      };
    });
    
    res.json({
      success: true,
      projectRoot: projectRoot,
      baseUploadPath: basePath,
      directories: result,
      paths: {
        blogImages: path.join(basePath, 'blog-images'),
        currentWorkingDir: process.cwd(),
        __dirname: __dirname,
        __filename: __filename
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test endpoint to create a test file
router.get('/test-create', (req, res) => {
  const testDir = path.join(projectRoot, 'uploads', 'blog-images');
  const testFile = path.join(testDir, 'test-image.txt');
  
  try {
    // Ensure directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create a test file
    fs.writeFileSync(testFile, 'This is a test file created at ' + new Date().toISOString());
    
    res.json({
      success: true,
      message: 'Test file created',
      path: testFile,
      url: `/uploads/blog-images/test-image.txt`,
      fullUrl: `${req.protocol}://${req.get('host')}/uploads/blog-images/test-image.txt`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List files in directory
router.get('/list/:type', (req, res) => {
  const { type } = req.params;
  const allowedTypes = ['blog-images', 'profiles', 'documents', 'general'];
  
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid directory type'
    });
  }
  
  const dirPath = path.join(projectRoot, 'uploads', type);
  
  console.log(`📁 Listing files in: ${dirPath}`);
  
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`❌ Directory does not exist: ${dirPath}`);
      return res.json({
        success: true,
        type: type,
        path: dirPath,
        exists: false,
        files: []
      });
    }
    
    const files = fs.readdirSync(dirPath);
    console.log(`✅ Found ${files.length} files in ${dirPath}`);
    
    const fileDetails = files.map(file => {
      const filePath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: `/uploads/${type}/${file}`,
          fullUrl: `${req.protocol}://${req.get('host')}/uploads/${type}/${file}`
        };
      } catch (err) {
        return {
          name: file,
          error: err.message,
          url: `/uploads/${type}/${file}`
        };
      }
    });
    
    res.json({
      success: true,
      type: type,
      path: dirPath,
      exists: true,
      fileCount: files.length,
      files: fileDetails
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get upload info
router.get('/info', (req, res) => {
  const basePath = path.join(projectRoot, 'uploads');
  
  res.json({
    success: true,
    data: {
      uploadBasePath: basePath,
      uploadDirectories: ['blog-images', 'profiles', 'documents', 'general'],
      maxFileSize: '10MB',
      allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'webp', 'svg'],
      serverUrl: `${req.protocol}://${req.get('host')}`,
      exampleImageUrl: `${req.protocol}://${req.get('host')}/uploads/blog-images/example.jpg`,
      paths: {
        projectRoot: projectRoot,
        currentDir: __dirname
      }
    }
  });
});

export default router;