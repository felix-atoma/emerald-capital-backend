import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config/config.js';

// Ensure upload directory exists
const uploadDir = config.upload.path;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const allowedDocTypes = ['application/pdf'];
  
  if (file.fieldname === 'passportPhoto' || file.fieldname === 'signature') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, and GIF images are allowed for photos'), false);
    }
  } else if (file.fieldname === 'ghanaCard' || file.fieldname === 'lastMonthPayslip' || 
             file.fieldname === 'bankStatement' || file.fieldname === 'compulsoryPayslip') {
    if (allowedImageTypes.includes(file.mimetype) || allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed for documents'), false);
    }
  } else {
    cb(new Error('Unexpected file field'), false);
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: fileFilter,
});

// Specific upload configurations
export const uploadLoanDocuments = upload.fields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'ghanaCard', maxCount: 2 }, // Front and back
  { name: 'lastMonthPayslip', maxCount: 3 },
  { name: 'bankStatement', maxCount: 6 }, // 3 months, 2 files per month
  { name: 'signature', maxCount: 1 },
  { name: 'compulsoryPayslip', maxCount: 1 },
]);

export const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.',
      });
    }
  }
  
  if (error.message.includes('Only')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  
  next(error);
};