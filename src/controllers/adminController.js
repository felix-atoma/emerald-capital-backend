import User from '../models/User.js';
import LoanApplication from '../models/LoanApplication.js';
import ContactMessage from '../models/ContactMessage.js';
import Newsletter from '../models/Newsletter.js';
import Blog from '../models/Blog.js'; // ADD THIS IMPORT
import jwt from 'jsonwebtoken';

// 🔐 ADMIN LOGIN FUNCTION - FIXED: Removed .toLowerCase()
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

    // Find admin user - FIX: Removed .toLowerCase()
    const admin = await User.findOne({ 
      username: username.trim(),  // CHANGED: Removed .toLowerCase()
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

// 👤 GET ADMIN PROFILE
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id; // From authentication middleware

    const admin = await User.findById(adminId).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin profile not found'
      });
    }

    // Check if user has admin role
    if (!['admin', 'officer'].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// 🔑 CHANGE ADMIN PASSWORD
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id; // From authentication middleware

    console.log('🔄 Admin password change request for ID:', adminId);

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find admin user
    const admin = await User.findById(adminId).select('+password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Check if user has admin role
    if (!['admin', 'officer'].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Verify current password
    const isPasswordValid = await admin.correctPassword(currentPassword);
    if (!isPasswordValid) {
      console.log('❌ Invalid current password for admin:', admin.username);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await admin.correctPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    console.log('✅ Admin password changed successfully for:', admin.username);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

// 📊 DASHBOARD STATISTICS
export const getDashboardStats = async (req, res) => {
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
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
};

// 📊 BLOG STATISTICS - NEW FUNCTION
export const getBlogStats = async (req, res) => {
  try {
    console.log('📊 Fetching blog statistics...');

    // Get basic blog statistics
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ isPublished: true });
    const draftBlogs = await Blog.countDocuments({ isPublished: false });
    const featuredBlogs = await Blog.countDocuments({ isFeatured: true });

    // Get category statistics
    const categoryStats = await Blog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent blog activity
    const recentBlogs = await Blog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category views likes comments isPublished createdAt');

    // Get popular blogs (by views)
    const popularBlogs = await Blog.find()
      .sort({ views: -1 })
      .limit(5)
      .select('title category views likes createdAt');

    // Get monthly blog creation stats
    const monthlyStats = await Blog.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    // Calculate growth (compared to last month)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthCount = await Blog.countDocuments({
      createdAt: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });

    const lastMonthCount = await Blog.countDocuments({
      createdAt: {
        $gte: new Date(lastMonthYear, lastMonth, 1),
        $lt: new Date(lastMonthYear, lastMonth + 1, 1)
      }
    });

    // Calculate growth percentage
    let growth = 0;
    if (lastMonthCount > 0) {
      growth = ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;
    } else if (currentMonthCount > 0) {
      growth = 100; // First month with blogs
    }

    // Format the response
    const response = {
      success: true,
      data: {
        stats: {
          total: totalBlogs,
          published: publishedBlogs,
          drafts: draftBlogs,
          featured: featuredBlogs,
          currentMonth: currentMonthCount,
          lastMonth: lastMonthCount,
          growth: parseFloat(growth.toFixed(1))
        },
        categories: categoryStats.map(cat => ({
          name: cat._id || 'Uncategorized',
          count: cat.count
        })),
        recent: recentBlogs.map(blog => ({
          id: blog._id,
          title: blog.title,
          category: blog.category,
          views: blog.views || 0,
          likes: blog.likes || 0,
          comments: blog.comments?.length || 0,
          isPublished: blog.isPublished,
          createdAt: blog.createdAt
        })),
        popular: popularBlogs.map(blog => ({
          id: blog._id,
          title: blog.title,
          category: blog.category,
          views: blog.views || 0,
          likes: blog.likes || 0,
          createdAt: blog.createdAt
        })),
        monthly: monthlyStats.map(stat => ({
          year: stat._id.year,
          month: stat._id.month,
          count: stat.count
        }))
      }
    };

    console.log('✅ Blog statistics retrieved successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Get blog stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blog statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 👥 GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.query.role;
    const isActive = req.query.isActive;
    const search = req.query.search;

    const filter = {};
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// 👤 GET SINGLE USER
export const getUser = async (req, res) => {
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
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

// ✏️ UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const { role, isActive, isVerified, firstName, lastName, email } = req.body;

    const updates = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (isVerified !== undefined) updates.isVerified = isVerified;
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;

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
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

// 🗑️ DELETE USER
export const deleteUser = async (req, res) => {
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
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};