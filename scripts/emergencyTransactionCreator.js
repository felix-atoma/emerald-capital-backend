import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const generateReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `TXN${timestamp}${random}`;
};

const createEmergencyTransaction = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Transaction = (await import('../src/models/Transaction.js')).default;
    const Account = (await import('../src/models/Account.js')).default;

    const senderAccount = await Account.findOne({ accountNumber: 'GH2916193699' });
    const recipientAccount = await Account.findOne({ accountNumber: 'EMERG1760209998937v3y6g' });

    if (!senderAccount || !recipientAccount) {
      console.log('❌ Accounts not found');
      return;
    }

    console.log('🚨 Creating emergency transaction with manual reference...');

    const transaction = new Transaction({
      user: senderAccount.user,
      account: senderAccount._id,
      type: 'debit',
      amount: 10.00,
      description: 'Emergency test transaction',
      category: 'transfer',
      status: 'completed',
      reference: generateReference() // Force manual reference
    });

    await transaction.save();
    console.log('✅ Emergency transaction created!');
    console.log('Reference:', transaction.reference);
    console.log('Type:', transaction.type);
    console.log('Amount:', transaction.amount);

    // Clean up
    await Transaction.deleteOne({ _id: transaction._id });
    console.log('🧹 Emergency transaction cleaned up');

  } catch (error) {
    console.error('❌ Emergency creation failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

createEmergencyTransaction();