import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/Transaction.js';
import User from '../src/models/User.js';

dotenv.config();

const debugTransactionStats = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find test user
    const testUser = await User.findOne({ email: 'john.doe@test.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log(`👤 User: ${testUser.email} (ID: ${testUser._id})`);

    // Check all transactions for this user
    const allTransactions = await Transaction.find({ user: testUser._id });
    console.log(`\n📊 Found ${allTransactions.length} total transactions:`);
    
    allTransactions.forEach((txn, index) => {
      console.log(`   ${index + 1}. ${txn.type.toUpperCase()} - GHS ${txn.amount} - ${txn.description} - ${txn.status}`);
    });

    // Test different aggregation periods
    const periods = ['day', 'week', 'month', 'year'];
    
    for (const period of periods) {
      console.log(`\n📈 Testing stats for period: ${period}`);
      
      const now = new Date();
      let startDate;

      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      console.log(`   Start date: ${startDate.toISOString()}`);

      try {
        const stats = await Transaction.aggregate([
          {
            $match: {
              user: testUser._id,
              createdAt: { $gte: startDate },
              status: 'completed'
            }
          },
          {
            $group: {
              _id: '$type',
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);

        console.log(`   Aggregation result:`, JSON.stringify(stats, null, 2));

        // Calculate totals
        let credits = 0;
        let debits = 0;
        let transfers = 0;
        let totalTransactions = 0;

        stats.forEach(stat => {
          if (stat._id === 'credit') {
            credits = stat.totalAmount;
            totalTransactions += stat.count;
          } else if (stat._id === 'debit') {
            debits = stat.totalAmount;
            totalTransactions += stat.count;
          } else if (stat._id === 'transfer') {
            transfers = stat.totalAmount;
            totalTransactions += stat.count;
          }
        });

        console.log(`   📊 Summary for ${period}:`);
        console.log(`      Credits: GHS ${credits}`);
        console.log(`      Debits: GHS ${debits}`);
        console.log(`      Transfers: GHS ${transfers}`);
        console.log(`      Total Transactions: ${totalTransactions}`);

      } catch (error) {
        console.log(`   ❌ Error in ${period} aggregation:`, error.message);
      }
    }

    // Test with ObjectId conversion
    console.log('\n🔧 Testing with ObjectId conversion...');
    try {
      const statsWithObjectId = await Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(testUser._id),
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);
      console.log('   ObjectId conversion result:', JSON.stringify(statsWithObjectId, null, 2));
    } catch (error) {
      console.log('   ❌ ObjectId conversion error:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 MongoDB connection closed');
  }
};

debugTransactionStats();