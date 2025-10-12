import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const emergencyFixAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = (await import('../src/models/User.js')).default;
    const Account = (await import('../src/models/Account.js')).default;

    // Find all users without accounts
    const usersWithoutAccounts = await User.aggregate([
      {
        $lookup: {
          from: 'accounts',
          localField: '_id',
          foreignField: 'user',
          as: 'accounts'
        }
      },
      {
        $match: {
          'accounts.0': { $exists: false }
        }
      }
    ]);

    console.log(`📊 Found ${usersWithoutAccounts.length} users without accounts`);

    for (const user of usersWithoutAccounts) {
      try {
        console.log(`🔄 Creating account for: ${user.email}`);
        
        // Create account - this should now work with the fixed model
        const account = new Account({
          user: user._id,
          balance: 0.00
        });
        
        await account.save();
        console.log(`✅ Created account ${account.accountNumber} for ${user.email}`);
      } catch (error) {
        console.log(`❌ Failed for ${user.email}:`, error.message);
        
        // If still failing, create with manual account number
        if (error.name === 'ValidationError' && error.errors?.accountNumber) {
          console.log(`🔧 Manual fix for ${user.email}...`);
          const manualAccount = new Account({
            user: user._id,
            balance: 0.00,
            accountNumber: `EMERG${Date.now()}${Math.random().toString(36).substr(2, 5)}`
          });
          await manualAccount.save();
          console.log(`✅ Manual account created: ${manualAccount.accountNumber}`);
        }
      }
    }

    console.log('\n🎉 Emergency account fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
  }
};

emergencyFixAccounts();