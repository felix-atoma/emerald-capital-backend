import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: 'GHS',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  category: {
    type: String,
    enum: ['transfer', 'payment', 'deposit', 'withdrawal', 'bill', 'airtime', 'data', 'other'],
    default: 'other'
  },
  recipient: {
    name: String,
    accountNumber: String,
    bank: String
  },
  sender: {
    name: String,
    accountNumber: String,
    bank: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// FIXED: Pre-save middleware with better error handling
transactionSchema.pre('save', function(next) {
  console.log('🔧 Pre-save hook called for transaction');
  
  if (this.isNew && !this.reference) {
    console.log('🔄 Generating reference for new transaction');
    try {
      this.reference = this.constructor.generateReference();
      console.log('✅ Reference generated:', this.reference);
    } catch (error) {
      console.log('❌ Reference generation failed:', error.message);
      return next(error);
    }
  }
  next();
});

// FIXED: Static method for reference generation
transactionSchema.statics.generateReference = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `TXN${timestamp}${random}`;
};

// FIXED: Create method that handles reference generation
transactionSchema.statics.createWithReference = function(data) {
  const transaction = new this({
    ...data,
    reference: this.generateReference()
  });
  return transaction.save();
};

// Static method to get transactions by user ID with pagination
transactionSchema.statics.findByUserId = function(userId, options = {}) {
  const { limit = 10, page = 1, type = '', category = '' } = options;
  
  const query = { user: userId };
  if (type) query.type = type;
  if (category) query.category = category;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = function(userId, period = 'month') {
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

  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
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
};

export default mongoose.model('Transaction', transactionSchema);