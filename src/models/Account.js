import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0.00,
    required: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  currency: {
    type: String,
    default: 'GHS',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },
  lastTransactionDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// FIXED: Pre-save middleware to generate account number
accountSchema.pre('save', async function(next) {
  if (this.isNew && !this.accountNumber) {
    try {
      this.accountNumber = await generateAccountNumber();
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// FIXED: Account number generator function
async function generateAccountNumber() {
  const Account = mongoose.model('Account');
  let accountNumber;
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    // Generate 10-digit number
    const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
    accountNumber = `GH${randomNum}`;
    
    // Check if account number already exists
    const existingAccount = await Account.findOne({ accountNumber });
    if (!existingAccount) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Could not generate unique account number');
  }
  
  return accountNumber;
}

// Method to update balance
accountSchema.methods.updateBalance = async function(amount, type) {
  if (type === 'credit') {
    this.balance += amount;
  } else if (type === 'debit') {
    if (this.balance < amount) {
      throw new Error('Insufficient funds');
    }
    this.balance -= amount;
  }
  
  this.lastTransactionDate = new Date();
  return this.save();
};

// Static method to get account by user ID
accountSchema.statics.findByUserId = function(userId) {
  return this.findOne({ user: userId });
};

export default mongoose.model('Account', accountSchema);