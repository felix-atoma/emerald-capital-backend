import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testTransactionModel = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Transaction = (await import('../src/models/Transaction.js')).default;
    const Account = (await import('../src/models/Account.js')).default;

    // Get test accounts
    const senderAccount = await Account.findOne({ accountNumber: 'GH2916193699' });
    const recipientAccount = await Account.findOne({ accountNumber: 'EMERG1760209998937v3y6g' });

    if (!senderAccount || !recipientAccount) {
      console.log('❌ Test accounts not found');
      return;
    }

    console.log('🧪 Testing Transaction Model Reference Generation');
    console.log('='.repeat(50));

    // Test 1: Create transaction without reference
    console.log('\n🔍 Test 1: Creating transaction without reference...');
    try {
      const transaction1 = new Transaction({
        user: senderAccount.user,
        account: senderAccount._id,
        type: 'debit',
        amount: 10.00,
        description: 'Test transaction 1',
        category: 'transfer'
      });

      console.log('Before save - Reference:', transaction1.reference);
      await transaction1.save();
      console.log('After save - Reference:', transaction1.reference);
      console.log('✅ Transaction 1 created successfully!');

      // Clean up
      await Transaction.deleteOne({ _id: transaction1._id });
      console.log('🧹 Transaction 1 cleaned up');
    } catch (error) {
      console.log('❌ Transaction 1 failed:', error.message);
    }

    // Test 2: Create another transaction
    console.log('\n🔍 Test 2: Creating another transaction...');
    try {
      const transaction2 = new Transaction({
        user: senderAccount.user,
        account: senderAccount._id,
        type: 'credit',
        amount: 50.00,
        description: 'Test transaction 2',
        category: 'deposit'
      });

      console.log('Before save - Reference:', transaction2.reference);
      await transaction2.save();
      console.log('After save - Reference:', transaction2.reference);
      console.log('✅ Transaction 2 created successfully!');

      // Clean up
      await Transaction.deleteOne({ _id: transaction2._id });
      console.log('🧹 Transaction 2 cleaned up');
    } catch (error) {
      console.log('❌ Transaction 2 failed:', error.message);
    }

    // Test 3: Check if references are unique
    console.log('\n🔍 Test 3: Checking reference uniqueness...');
    try {
      const transaction3 = new Transaction({
        user: senderAccount.user,
        account: senderAccount._id,
        type: 'debit',
        amount: 25.00,
        description: 'Test transaction 3',
        category: 'payment'
      });

      const transaction4 = new Transaction({
        user: senderAccount.user,
        account: senderAccount._id,
        type: 'credit',
        amount: 75.00,
        description: 'Test transaction 4',
        category: 'deposit'
      });

      await transaction3.save();
      await transaction4.save();

      console.log('Transaction 3 Reference:', transaction3.reference);
      console.log('Transaction 4 Reference:', transaction4.reference);
      console.log('References are different:', transaction3.reference !== transaction4.reference);

      // Clean up
      await Transaction.deleteMany({ 
        _id: { $in: [transaction3._id, transaction4._id] } 
      });
      console.log('🧹 Transactions 3 & 4 cleaned up');
    } catch (error) {
      console.log('❌ Transactions 3 & 4 failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 MongoDB connection closed');
  }
};

testTransactionModel();