import User from '../models/User.js';
import LoanApplication from '../models/LoanApplication.js';
import ContactMessage from '../models/ContactMessage.js';
import Newsletter from '../models/Newsletter.js';

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