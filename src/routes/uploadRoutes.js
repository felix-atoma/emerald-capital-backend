import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { 
  uploadImage, 
  uploadMultipleImages, 
  deleteImage, 
  getOptimizedImageUrl,
  getUploadConfig 
} from '../controllers/uploadController.js';

const router = express.Router();

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public routes
router.get('/config', getUploadConfig);
router.get('/optimize/:publicId', getOptimizedImageUrl);

// Protected routes
router.use(authenticate);

// Upload routes
router.post('/image', upload.single('image'), uploadImage);
router.post('/images', upload.array('images', 5), uploadMultipleImages);
router.delete('/:publicId', authorize('admin', 'author'), deleteImage);

export default router;