import express from 'express';
import {
  adminLogin,  // ADD THIS IMPORT
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 🔓 PUBLIC ROUTE - Admin login (MUST be before authentication)
router.post('/login', adminLogin);

// 🔒 PROTECTED ROUTES - Everything below requires authentication
router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;