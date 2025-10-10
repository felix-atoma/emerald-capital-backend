import express from 'express';
import User from '../models/User.js';
import { generateAuthTokens } from '../utils/tokenGenerator.js';
import {
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// ✅ ADMIN LOGIN ROUTE (public - no auth required)
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Admin login attempt for username:', username);

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Find admin user and include password for verification
    const user = await User.findOne({
      $or: [
        { username },
        { email: username },
        { accountNumber: username }
      ]
    }).select('+password');

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    console.log('👤 User found:', user.username, 'Role:', user.role);

    // Check password - using the CORRECT method signature
    const isPasswordCorrect = await user.correctPassword(password);
    
    if (!isPasswordCorrect) {
      console.log('❌ Password incorrect');
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    console.log('✅ Password correct');

    // Check if user has admin or officer role
    if (user.role !== 'admin' && user.role !== 'officer') {
      console.log('❌ Insufficient privileges. User role:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      console.log('❌ Account inactive');
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateAuthTokens(user);

    // Remove password from output
    user.password = undefined;

    console.log('✅ Admin login successful');

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    console.error('💥 Admin login error:', error);
    next(error);
  }
});

// All routes below require authentication and admin/officer role
router.use(authenticate);
router.use(authorize('admin', 'officer'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;