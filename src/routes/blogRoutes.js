// routes/blogRoutes.js
import express from 'express';
import {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
  bookmarkBlog,
  addComment,
  deleteComment,
  getMyBookmarks,
  getMyLikes,
  getBlogStats,
  getPopularBlogs
} from '../controllers/blogController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes - anyone can access
router.get('/', optionalAuth, getBlogs);
router.get('/popular', getPopularBlogs);
router.get('/:slug', optionalAuth, getBlog);

// Protected routes (require authentication)
router.use(authenticate);

// User interaction routes - any authenticated user can access
router.put('/:id/like', likeBlog);
router.put('/:id/bookmark', bookmarkBlog);
router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);
router.get('/bookmarks/my', getMyBookmarks);
router.get('/likes/my', getMyLikes);

// Admin routes - only admin can access
router.use(authorize('admin'));

router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);
router.get('/stats/summary', getBlogStats);

export default router;