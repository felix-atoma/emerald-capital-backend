import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkRecipientAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = (await import('../src/models/User.js')).default;
    const Account = (await import('../src/models/Account.js')).default;

    // Check jane.smith@test.com
    const user = await User.findOne({ email: 'jane.smith@test.com' });
    if (!user) {
      console.log('❌ User jane.smith@test.com not found');
      return;
    }

    console.log('✅ User found:', user.email);
    
    const account = await Account.findOne({ user: user._id });
    if (account) {
      console.log('✅ Account found:', account.accountNumber);
      console.log('💰 Balance: GHS', account.balance);
    } else {
      console.log('❌ No account found for user');
      
      // Try to create account
      console.log('🔄 Creating account...');
      const newAccount = new Account({
        user: user._id,
        balance: 500.00
      });
      await newAccount.save();
      console.log('✅ Account created:', newAccount.accountNumber);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

checkRecipientAccount();