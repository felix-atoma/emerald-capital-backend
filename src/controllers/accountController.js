import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

// Get account balance
export const getAccountBalance = async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.user.id });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.json({
      success: true,
      data: {
        balance: account.balance,
        currency: account.currency,
        accountNumber: account.accountNumber,
        status: account.status
      }
    });
  } catch (error) {
    console.error('Get account balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching account balance'
    });
  }
};

// Get account details
export const getAccountDetails = async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.user.id })
      .populate('user', 'name email phone');
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Get recent transactions count
    const recentTransactionsCount = await Transaction.countDocuments({
      user: req.user.id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    res.json({
      success: true,
      data: {
        account: {
          balance: account.balance,
          currency: account.currency,
          accountNumber: account.accountNumber,
          status: account.status,
          createdAt: account.createdAt,
          lastTransactionDate: account.lastTransactionDate
        },
        user: account.user,
        stats: {
          recentTransactions: recentTransactionsCount
        }
      }
    });
  } catch (error) {
    console.error('Get account details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching account details'
    });
  }
};

// Create new account (usually called during user registration)
export const createAccount = async (userId) => {
  try {
    const existingAccount = await Account.findOne({ user: userId });
    if (existingAccount) {
      throw new Error('Account already exists for this user');
    }

    const account = new Account({
      user: userId,
      balance: 0.00
    });

    await account.save();
    return account;
  } catch (error) {
    console.error('Create account error:', error);
    throw error;
  }
};

// Update account status
export const updateAccountStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'suspended', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const account = await Account.findOne({ user: req.user.id });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    account.status = status;
    await account.save();

    res.json({
      success: true,
      message: `Account ${status} successfully`,
      data: {
        status: account.status
      }
    });
  } catch (error) {
    console.error('Update account status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating account status'
    });
  }
};