import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';

// Get transactions with pagination and filtering
export const getTransactions = async (req, res) => {
  try {
    const { limit = 10, page = 1, type = '', category = '' } = req.query;
    
    const query = { user: req.user.id };
    if (type) query.type = type;
    if (category) query.category = category;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
};

// Get transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findOne({
      _id: id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction'
    });
  }
};

// Create a new transaction
export const createTransaction = async (transactionData) => {
  try {
    const transaction = new Transaction(transactionData);
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Create transaction error:', error);
    throw error;
  }
};

// Get transaction statistics
export const getTransactionStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    console.log(`📊 Getting transaction stats for user: ${req.user.id}, period: ${period}`);

    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    console.log(`📅 Stats period from: ${startDate.toISOString()}`);

    // FIXED: Use mongoose.Types.ObjectId for proper aggregation
    const stats = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('📈 Raw aggregation result:', JSON.stringify(stats, null, 2));

    // Format stats with proper defaults
    const formattedStats = {
      credits: 0,
      debits: 0,
      transfers: 0,
      totalTransactions: 0,
      netAmount: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'credit') {
        formattedStats.credits = stat.totalAmount;
        formattedStats.totalTransactions += stat.count;
        formattedStats.netAmount += stat.totalAmount;
      } else if (stat._id === 'debit') {
        formattedStats.debits = stat.totalAmount;
        formattedStats.totalTransactions += stat.count;
        formattedStats.netAmount -= stat.totalAmount;
      } else if (stat._id === 'transfer') {
        formattedStats.transfers = stat.totalAmount;
        formattedStats.totalTransactions += stat.count;
        formattedStats.netAmount -= stat.totalAmount; // Transfers are typically debits
      }
    });

    console.log('📊 Formatted stats:', formattedStats);

    res.json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('❌ Get transaction stats error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Process fund transfer
export const transferFunds = async (req, res) => {
  console.log('🔄 Transfer request received:', req.body);
  
  try {
    const { recipientAccountNumber, amount, description } = req.body;
    
    // Input validation
    if (!recipientAccountNumber || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient account number or amount'
      });
    }

    console.log('🔍 Validating transfer...');

    // Get sender's account
    const senderAccount = await Account.findOne({ user: req.user.id });
    if (!senderAccount) {
      return res.status(404).json({
        success: false,
        message: 'Sender account not found'
      });
    }

    // Check if sender has sufficient balance
    if (senderAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds'
      });
    }

    // Get recipient's account
    const recipientAccount = await Account.findOne({ 
      accountNumber: recipientAccountNumber 
    }).populate('user', 'name');
    
    if (!recipientAccount) {
      return res.status(404).json({
        success: false,
        message: 'Recipient account not found'
      });
    }

    // Prevent self-transfer
    if (senderAccount._id.toString() === recipientAccount._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to your own account'
      });
    }

    console.log('✅ Transfer validation passed');

    // Update sender's balance
    senderAccount.balance -= amount;
    senderAccount.lastTransactionDate = new Date();
    await senderAccount.save();

    // Update recipient's balance
    recipientAccount.balance += amount;
    recipientAccount.lastTransactionDate = new Date();
    await recipientAccount.save();

    // FIXED: Use createWithReference for both transactions
    const debitTransaction = await Transaction.createWithReference({
      user: req.user.id,
      account: senderAccount._id,
      type: 'debit',
      amount: amount,
      description: description || `Transfer to ${recipientAccountNumber}`,
      category: 'transfer',
      recipient: {
        name: recipientAccount.user?.name || 'Unknown',
        accountNumber: recipientAccountNumber
      },
      status: 'completed'
    });

    const creditTransaction = await Transaction.createWithReference({
      user: recipientAccount.user._id,
      account: recipientAccount._id,
      type: 'credit',
      amount: amount,
      description: description || `Transfer from ${senderAccount.accountNumber}`,
      category: 'transfer',
      sender: {
        name: req.user.name,
        accountNumber: senderAccount.accountNumber
      },
      status: 'completed'
    });

    console.log('✅ Transfer completed successfully');
    console.log('Debit Reference:', debitTransaction.reference);
    console.log('Credit Reference:', creditTransaction.reference);

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        transaction: debitTransaction,
        newBalance: senderAccount.balance
      }
    });

  } catch (error) {
    console.error('❌ Transfer error:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({
      success: false,
      message: 'Server error while processing transfer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};