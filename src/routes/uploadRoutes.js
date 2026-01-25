import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';

const router = express.Router();

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const directories = [
    'uploads/blog-images',
    'uploads/profiles',
    'uploads/documents',
    'uploads/general'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Create directories on startup
createUploadDirectories();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (req.query.type === 'blog') {
      uploadPath += 'blog-images/';
    } else if (req.query.type === 'profile') {
      uploadPath += 'profiles/';
    } else if (req.query.type === 'document') {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'general/';
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

const imageUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter
});

// Protected routes
router.use(authenticate);

// Upload single image (only images)
router.post('/image', imageUpload.single('image'), uploadImage);

// Upload multiple images (only images)
router.post('/images', imageUpload.array('images', 5), uploadImage);

// Upload file (any allowed type)
router.post('/file', upload.single('file'), uploadImage);

// Delete image
router.delete('/image/:filename', authorize('admin', 'author'), deleteImage);

// Get upload info
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      uploadDirectories: ['blog-images', 'profiles', 'documents', 'general'],
      maxFileSize: '5MB',
      allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'webp', 'svg']
    }
  });
});

export default router;