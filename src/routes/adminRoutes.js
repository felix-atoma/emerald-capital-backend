import express from 'express';
import {
  adminLogin,
  getAdminProfile,
  changeAdminPassword,
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// 🔓 PUBLIC ROUTES - No authentication required
// ============================================================

// Admin login - MUST be BEFORE authenticate middleware
router.post('/login', adminLogin);

// ============================================================
// 🔒 PROTECTED ROUTES - Require authentication
// ============================================================

// Apply authentication middleware to all routes below
router.use(authenticate);

// Admin profile routes
router.get('/profile', getAdminProfile);
router.put('/change-password', changeAdminPassword);

// Apply admin authorization to all routes below
router.use(authorize('admin', 'officer'));

// Dashboard and user management
router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;