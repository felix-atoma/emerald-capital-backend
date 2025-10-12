import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const createAccountForUser = async (email) => {
  try {
    const User = (await import('../src/models/User.js')).default;
    const Account = (await import('../src/models/Account.js')).default;
    const { generateAccountNumber } = await import('../src/utils/accountNumberGenerator.js');
    const config = (await import('../src/config/config.js')).default;

    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      await mongoose.connection.close();
      return;
    }

    // Check if user already has an account
    const existingAccount = await Account.findOne({ user: user._id });
    
    if (existingAccount) {
      console.log(`ℹ️ User ${email} already has account: ${existingAccount.accountNumber}`);
      await mongoose.connection.close();
      return;
    }

    // Create account
    const accountNumber = generateAccountNumber();
    const account = await Account.create({
      user: user._id,
      balance: 0.00,
      accountNumber: accountNumber,
      currency: 'GHS'
    });

    console.log(`✅ Created account ${accountNumber} for ${email}`);
    console.log(`💰 Initial balance: GHS ${account.balance}`);
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node createAccountForUser.js <email>');
  process.exit(1);
}

createAccountForUser(email);