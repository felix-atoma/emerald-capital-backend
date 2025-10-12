import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const debugStatsIssue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Transaction = (await import('../src/models/Transaction.js')).default;
    const User = (await import('../src/models/User.js')).default;

    // Find test user
    const testUser = await User.findOne({ email: 'john.doe@test.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log(`👤 User: ${testUser.email} (ID: ${testUser._id})`);

    // Check all transactions for this user
    const allTransactions = await Transaction.find({ user: testUser._id });
    console.log(`\n📊 Found ${allTransactions.length} transactions:`);
    
    allTransactions.forEach((txn, index) => {
      console.log(`   ${index + 1}. ${txn.type.toUpperCase()} - GHS ${txn.amount} - ${txn.description} - ${txn.reference}`);
    });

    // Test the exact aggregation used in the controller
    console.log('\n🔍 Testing exact aggregation query...');
    
    const stats = await Transaction.aggregate([
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

    console.log('📈 Aggregation result:', JSON.stringify(stats, null, 2));

    // Test with different user ID formats
    console.log('\n🔍 Testing different user ID formats...');
    
    const tests = [
      { desc: 'String ID', id: testUser._id.toString() },
      { desc: 'ObjectId', id: new mongoose.Types.ObjectId(testUser._id) },
      { desc: 'Direct', id: testUser._id }
    ];

    for (const test of tests) {
      console.log(`\nTesting with ${test.desc}: ${test.id}`);
      try {
        const testStats = await Transaction.aggregate([
          {
            $match: {
              user: test.id,
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
        console.log(`✅ ${test.desc} worked:`, JSON.stringify(testStats));
      } catch (error) {
        console.log(`❌ ${test.desc} failed:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 MongoDB connection closed');
  }
};

debugStatsIssue();