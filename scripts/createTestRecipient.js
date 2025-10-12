import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const createTestRecipient = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // FIXED: Correct import paths
    const User = (await import('../src/models/User.js')).default;
    const Account = (await import('../src/models/Account.js')).default;

    // Check if recipient user already exists
    let recipientUser = await User.findOne({ email: 'jane.smith@test.com' });
    
    if (recipientUser) {
      console.log('✅ Recipient user already exists:', recipientUser.email);
    } else {
      console.log('❌ Recipient user not found, please create manually');
      await mongoose.connection.close();
      return;
    }

    // Check if account already exists for this user
    let recipientAccount = await Account.findOne({ user: recipientUser._id });
    
    if (recipientAccount) {
      console.log('✅ Recipient account already exists:', recipientAccount.accountNumber);
      console.log('💰 Current balance: GHS', recipientAccount.balance);
    } else {
      console.log('🔄 Creating account for existing user...');
      
      // Create account for recipient - let the model generate accountNumber
      recipientAccount = new Account({
        user: recipientUser._id,
        balance: 500.00,
        currency: 'GHS'
      });
      
      await recipientAccount.save();
      console.log('✅ Created recipient account:', recipientAccount.accountNumber);
      console.log('💰 Initial balance: GHS', recipientAccount.balance);
    }

    console.log('\n🎉 Test recipient ready!');
    console.log('📧 Email: jane.smith@test.com');
    console.log('🔢 Account:', recipientAccount.accountNumber);
    console.log('💵 Balance: GHS', recipientAccount.balance);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'ValidationError') {
      console.log('🔧 Validation errors:');
      Object.keys(error.errors).forEach(field => {
        console.log(`   - ${field}: ${error.errors[field].message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
  }
};

createTestRecipient();