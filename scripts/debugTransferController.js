import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const debugTransferController = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Account = (await import('../src/models/Account.js')).default;
    const Transaction = (await import('../src/models/Transaction.js')).default;

    // Test database operations that happen in transfer
    console.log('\n🔍 Testing database operations...');

    // 1. Test finding accounts
    const senderAccount = await Account.findOne({ accountNumber: 'GH2916193699' });
    console.log('✅ Sender account found:', senderAccount?.accountNumber);

    const recipientAccount = await Account.findOne({ accountNumber: 'EMERG1760209998937v3y6g' });
    console.log('✅ Recipient account found:', recipientAccount?.accountNumber);

    if (!senderAccount || !recipientAccount) {
      console.log('❌ Missing accounts for testing');
      return;
    }

    // 2. Test transaction creation
    console.log('\n🔍 Testing transaction creation...');
    try {
      const testTransaction = new Transaction({
        user: senderAccount.user,
        account: senderAccount._id,
        type: 'debit',
        amount: 10.00,
        description: 'Test transaction',
        category: 'transfer'
      });
      await testTransaction.save();
      console.log('✅ Transaction created successfully');
      console.log('   Reference:', testTransaction.reference);
      
      // Clean up
      await Transaction.deleteOne({ _id: testTransaction._id });
      console.log('   🧹 Test transaction cleaned up');
    } catch (txnError) {
      console.log('❌ Transaction creation failed:', txnError.message);
    }

    // 3. Test MongoDB session (transactions)
    console.log('\n🔍 Testing MongoDB sessions...');
    try {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      console.log('✅ Session started');
      
      // Test operations within session
      senderAccount.balance -= 10;
      await senderAccount.save({ session });
      console.log('✅ Sender balance updated in session');
      
      await session.commitTransaction();
      session.endSession();
      console.log('✅ Session committed successfully');
      
      // Revert changes
      senderAccount.balance += 10;
      await senderAccount.save();
      console.log('✅ Balance reverted');
      
    } catch (sessionError) {
      console.log('❌ Session test failed:', sessionError.message);
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 MongoDB connection closed');
  }
};

debugTransferController();