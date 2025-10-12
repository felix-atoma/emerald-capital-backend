import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fixExistingAccounts = async () => {
  try {
    // Use direct MongoDB URI
    const mongodbUri = process.env.MONGODB_URI || 'mongodb+srv://felixatoma2:yvaPR1cxDGkMQxG2@cluster0.wllhjbf.mongodb.net/nashma?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔗 Connecting to MongoDB...');
    console.log('URI:', mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    await mongoose.connect(mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Import models
    const User = (await import('../src/models/User.js')).default;
    const Account = (await import('../src/models/Account.js')).default;
    
    // Simple account number generator (fallback)
    const generateAccountNumber = () => {
      return 'GH' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
    };

    // Find all users
    const allUsers = await User.find({});
    console.log(`📊 Found ${allUsers.length} total users`);

    let createdCount = 0;
    let existingCount = 0;

    console.log('\n🔄 Checking/creating accounts...');
    for (const user of allUsers) {
      // Check if account exists
      const existingAccount = await Account.findOne({ user: user._id });
      
      if (existingAccount) {
        console.log(`✅ ${user.email} already has account: ${existingAccount.accountNumber}`);
        existingCount++;
      } else {
        try {
          const accountNumber = generateAccountNumber();
          await Account.create({
            user: user._id,
            balance: 0.00,
            accountNumber: accountNumber,
            currency: 'GHS'
          });
          console.log(`✅ Created account ${accountNumber} for ${user.email}`);
          createdCount++;
        } catch (error) {
          console.log(`❌ Failed for ${user.email}:`, error.message);
        }
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Existing accounts: ${existingCount}`);
    console.log(`🆕 New accounts created: ${createdCount}`);
    console.log(`👥 Total users: ${allUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔒 MongoDB connection closed');
    }
    process.exit(0);
  }
};

fixExistingAccounts();