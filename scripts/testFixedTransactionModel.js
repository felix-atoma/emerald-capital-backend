import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testFixedTransactionModel = async () => {
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

    console.log('🧪 Testing FIXED Transaction Model');
    console.log('='.repeat(50));

    // Test 1: Using createWithReference method
    console.log('\n🔍 Test 1: Using createWithReference method...');
    try {
      const transaction1 = await Transaction.createWithReference({
        user: senderAccount.user,
        account: senderAccount._id,
        type: 'debit',
        amount: 10.00,
        description: 'Test with createWithReference',
        category: 'transfer'
      });

      console.log('✅ Transaction created successfully!');
      console.log('Reference:', transaction1.reference);
      console.log('Type:', transaction1.type);
      console.log('Amount:', transaction1.amount);

      // Clean up
      await Transaction.deleteOne({ _id: transaction1._id });
      console.log('🧹 Transaction cleaned up');
    } catch (error) {
      console.log('❌ createWithReference failed:', error.message);
    }

    // Test 2: Using normal constructor with pre-save hook
    console.log('\n🔍 Test 2: Using normal constructor...');
    try {
      const transaction2 = new Transaction({
        user: senderAccount.user,
        account: senderAccount._id,
        type: 'credit',
        amount: 50.00,
        description: 'Test normal constructor',
        category: 'deposit'
      });

      console.log('Before save - Reference:', transaction2.reference);
      await transaction2.save();
      console.log('After save - Reference:', transaction2.reference);
      console.log('✅ Normal constructor worked!');

      // Clean up
      await Transaction.deleteOne({ _id: transaction2._id });
      console.log('🧹 Transaction cleaned up');
    } catch (error) {
      console.log('❌ Normal constructor failed:', error.message);
      if (error.errors) {
        Object.keys(error.errors).forEach(field => {
          console.log(`   - ${field}: ${error.errors[field].message}`);
        });
      }
    }

    // Test 3: Test reference uniqueness
    console.log('\n🔍 Test 3: Testing reference uniqueness...');
    try {
      const transaction3 = await Transaction.createWithReference({
        user: senderAccount.user,
        account: senderAccount._id,
        type: 'debit',
        amount: 25.00,
        description: 'Test uniqueness 1',
        category: 'payment'
      });

      const transaction4 = await Transaction.createWithReference({
        user: senderAccount.user,
        account: senderAccount._id,
        type: 'credit',
        amount: 75.00,
        description: 'Test uniqueness 2',
        category: 'deposit'
      });

      console.log('Transaction 3 Reference:', transaction3.reference);
      console.log('Transaction 4 Reference:', transaction4.reference);
      console.log('References are different:', transaction3.reference !== transaction4.reference);
      console.log('✅ Uniqueness test passed!');

      // Clean up
      await Transaction.deleteMany({ 
        _id: { $in: [transaction3._id, transaction4._id] } 
      });
      console.log('🧹 Transactions cleaned up');
    } catch (error) {
      console.log('❌ Uniqueness test failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 MongoDB connection closed');
  }
};

testFixedTransactionModel();