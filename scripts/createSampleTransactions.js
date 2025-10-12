import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/Transaction.js';
import Account from '../src/models/Account.js';
import User from '../src/models/User.js';

dotenv.config();

// Generate transaction reference
const generateTransactionReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `TXN${timestamp}${random}`;
};

const createSampleTransactions = async () => {
  try {
    const mongodbUri = process.env.MONGODB_URI;
    await mongoose.connect(mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Get a test user
    const testUser = await User.findOne({ email: 'john.doe@test.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Get user's account
    const account = await Account.findOne({ user: testUser._id });
    if (!account) {
      console.log('❌ Account not found for test user');
      return;
    }

    console.log(`👤 Using user: ${testUser.email}`);
    console.log(`💰 Account: ${account.accountNumber}`);

    // Create sample transactions with references
    const sampleTransactions = [
      {
        user: testUser._id,
        account: account._id,
        type: 'credit',
        amount: 1000.00,
        description: 'Initial deposit',
        category: 'deposit',
        status: 'completed',
        reference: generateTransactionReference()
      },
      {
        user: testUser._id,
        account: account._id,
        type: 'debit',
        amount: 50.00,
        description: 'Airtime purchase',
        category: 'airtime',
        status: 'completed',
        reference: generateTransactionReference()
      },
      {
        user: testUser._id,
        account: account._id,
        type: 'debit',
        amount: 100.00,
        description: 'Electricity bill payment',
        category: 'bill',
        status: 'completed',
        reference: generateTransactionReference()
      },
      {
        user: testUser._id,
        account: account._id,
        type: 'credit',
        amount: 500.00,
        description: 'Salary deposit',
        category: 'deposit',
        status: 'completed',
        reference: generateTransactionReference()
      },
      {
        user: testUser._id,
        account: account._id,
        type: 'transfer',
        amount: 200.00,
        description: 'Transfer to friend',
        category: 'transfer',
        status: 'completed',
        reference: generateTransactionReference()
      }
    ];

    // Clear existing transactions for this user
    await Transaction.deleteMany({ user: testUser._id });
    console.log('🧹 Cleared existing transactions');

    // Create new transactions
    for (const transactionData of sampleTransactions) {
      const transaction = new Transaction(transactionData);
      await transaction.save();
      console.log(`✅ Created ${transaction.type} transaction: GHS ${transaction.amount} - ${transaction.description}`);
      console.log(`   Reference: ${transaction.reference}`);
    }

    // Update account balance
    account.balance = 1150.00; // 1000 + 500 - 50 - 100 - 200
    await account.save();
    console.log(`💰 Updated account balance to: GHS ${account.balance}`);

    console.log('\n🎉 Sample transactions created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
  }
};

createSampleTransactions();