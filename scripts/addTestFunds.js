import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const addTestFunds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Account = (await import('../src/models/Account.js')).default;
    const Transaction = (await import('../src/models/Transaction.js')).default;
    const User = (await import('../src/models/User.js')).default;

    // Find test user
    const testUser = await User.findOne({ email: 'john.doe@test.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Get user's account
    const account = await Account.findOne({ user: testUser._id });
    if (!account) {
      console.log('❌ Account not found');
      return;
    }

    console.log(`💰 Current balance: GHS ${account.balance}`);

    // Add funds if balance is low
    if (account.balance < 1000) {
      const amountToAdd = 2000.00;
      account.balance += amountToAdd;
      await account.save();

      // Create a deposit transaction
      await Transaction.createWithReference({
        user: testUser._id,
        account: account._id,
        type: 'credit',
        amount: amountToAdd,
        description: 'Added test funds',
        category: 'deposit',
        status: 'completed'
      });

      console.log(`✅ Added GHS ${amountToAdd} to account`);
      console.log(`💰 New balance: GHS ${account.balance}`);
    } else {
      console.log('✅ Account has sufficient funds');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
  }
};

addTestFunds();