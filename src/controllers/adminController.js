import User from '../models/User.js';
import LoanApplication from '../models/LoanApplication.js';
import ContactMessage from '../models/ContactMessage.js';
import Newsletter from '../models/Newsletter.js';
import jwt from 'jsonwebtoken';

// 🔐 ADMIN LOGIN FUNCTION - ADD THIS
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Admin login attempt for:', username);

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin user
    const admin = await User.findOne({ 
      username: username.trim().toLowerCase(),
      role: { $in: ['admin', 'officer'] }
    }).select('+password');

    if (!admin) {
      console.log('❌ Admin user not found:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await admin.correctPassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for admin:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username,
        role: admin.role,
        email: admin.email
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    console.log('✅ Admin login successful for:', username);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Return admin data without password
    const adminData = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin
    };

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: adminData,
        tokens: {
          access: token
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// EXISTING FUNCTIONS (keep all your existing functions below)
export const getDashboardStats = async (req, res, next) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Get loan statistics
    const totalLoans = await LoanApplication.countDocuments();
    const pendingLoans = await LoanApplication.countDocuments({ status: 'pending' });
    const approvedLoans = await LoanApplication.countDocuments({ status: 'approved' });
    const rejectedLoans = await LoanApplication.countDocuments({ status: 'rejected' });
    
    const totalLoanAmount = await LoanApplication.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$approvedAmount' } } }
    ]);

    // Get contact message statistics
    const totalMessages = await ContactMessage.countDocuments();
    const newMessages = await ContactMessage.countDocuments({ status: 'new' });

    // Get newsletter statistics
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({ isActive: true });

    // Recent activities
    const recentLoans = await LoanApplication.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email');

    const recentMessages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          users: {
            total: totalUsers,
            active: activeUsers,
            newThisMonth: newUsersThisMonth,
          },
          loans: {
            total: totalLoans,
            pending: pendingLoans,
            approved: approvedLoans,
            rejected: rejectedLoans,
            totalAmount: totalLoanAmount[0]?.total || 0,
          },
          messages: {
            total: totalMessages,
            new: newMessages,
          },
          newsletter: {
            total: totalSubscribers,
            active: activeSubscribers,
          },
        },
        recentActivities: {
          loans: recentLoans,
          messages: recentMessages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.query.role;
    const isActive = req.query.isActive;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's loan applications
    const loanApplications = await LoanApplication.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        user,
        loanApplications,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { role, isActive, isVerified } = req.body;

    const updates = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (isVerified !== undefined) updates.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};