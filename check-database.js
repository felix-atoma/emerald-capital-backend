import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models directly from their files
import User from './src/models/User.js';
import LoanApplication from './src/models/LoanApplication.js';
import ContactMessage from './src/models/ContactMessage.js';
import Newsletter from './src/models/Newsletter.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`📊 Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const inspectDatabase = async () => {
  await connectDB();

  console.log('\n🔍 INSPECTING EMERALD CAPITAL DATABASE\n');
  console.log('='.repeat(80));

  // Get all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n📁 DATABASE COLLECTIONS:');
  collections.forEach(collection => {
    console.log(`   - ${collection.name}`);
  });

  // Check Users collection
  console.log('\n👥 USERS COLLECTION:');
  console.log('-'.repeat(40));
  const users = await User.find({}).select('-password').lean();
  console.log(`Total Users: ${users.length}`);
  
  users.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Ghana Card: ${user.ghanaCardNumber}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
    console.log(`   Verified: ${user.isVerified ? 'Yes' : 'No'}`);
    console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
    console.log(`   Account Number: ${user.accountNumber || 'Not generated'}`);
  });

  // Check Loan Applications collection
  console.log('\n💼 LOAN APPLICATIONS COLLECTION:');
  console.log('-'.repeat(40));
  const loans = await LoanApplication.find({})
    .populate('user', 'firstName lastName email phone')
    .lean();
  console.log(`Total Loan Applications: ${loans.length}`);
  
  loans.forEach((loan, index) => {
    console.log(`\n${index + 1}. Loan Application ID: ${loan._id}`);
    console.log(`   Applicant: ${loan.user?.firstName} ${loan.user?.lastName}`);
    console.log(`   Email: ${loan.user?.email}`);
    console.log(`   Phone: ${loan.user?.phone}`);
    console.log(`   Amount: GHS ${loan.loanAmountRequested}`);
    console.log(`   Tenor: ${loan.tenor} months`);
    console.log(`   Purpose: ${loan.loanPurpose}`);
    console.log(`   Status: ${loan.status}`);
    console.log(`   Created: ${new Date(loan.createdAt).toLocaleString()}`);
    if (loan.approvedAmount) {
      console.log(`   Approved Amount: GHS ${loan.approvedAmount}`);
    }
    if (loan.accountOfficer && loan.accountOfficer.name) {
      console.log(`   Officer: ${loan.accountOfficer.name}`);
    }
    if (loan.purposeDescription) {
      console.log(`   Description: ${loan.purposeDescription.substring(0, 50)}...`);
    }
  });

  // Check Contact Messages collection
  console.log('\n📞 CONTACT MESSAGES COLLECTION:');
  console.log('-'.repeat(40));
  const messages = await ContactMessage.find({}).lean();
  console.log(`Total Contact Messages: ${messages.length}`);
  
  messages.forEach((message, index) => {
    console.log(`\n${index + 1}. From: ${message.name}`);
    console.log(`   Email: ${message.email}`);
    console.log(`   Phone: ${message.phone || 'Not provided'}`);
    console.log(`   Status: ${message.status}`);
    console.log(`   Created: ${new Date(message.createdAt).toLocaleString()}`);
    console.log(`   Message Preview: ${message.message.substring(0, 80)}${message.message.length > 80 ? '...' : ''}`);
    console.log(`   Agreed to Terms: ${message.agreedToTerms ? 'Yes' : 'No'}`);
  });

  // Check Newsletter Subscriptions
  console.log('\n📰 NEWSLETTER SUBSCRIPTIONS:');
  console.log('-'.repeat(40));
  const subscribers = await Newsletter.find({}).lean();
  console.log(`Total Subscribers: ${subscribers.length}`);
  const activeSubscribers = subscribers.filter(s => s.isActive).length;
  console.log(`Active Subscribers: ${activeSubscribers}`);
  console.log(`Inactive Subscribers: ${subscribers.length - activeSubscribers}`);
  
  subscribers.forEach((subscriber, index) => {
    console.log(`\n${index + 1}. ${subscriber.email}`);
    console.log(`   Active: ${subscriber.isActive ? 'Yes' : 'No'}`);
    console.log(`   Subscribed: ${new Date(subscriber.createdAt).toLocaleString()}`);
    if (subscriber.unsubscribedAt) {
      console.log(`   Unsubscribed: ${new Date(subscriber.unsubscribedAt).toLocaleString()}`);
    }
    if (subscriber.subscriptionSource) {
      console.log(`   Source: ${subscriber.subscriptionSource}`);
    }
  });

  // Database Statistics
  console.log('\n📊 DATABASE STATISTICS:');
  console.log('-'.repeat(40));
  console.log(`Total Collections: ${collections.length}`);
  console.log(`Total Users: ${users.length}`);
  console.log(`Total Loan Applications: ${loans.length}`);
  console.log(`Total Contact Messages: ${messages.length}`);
  console.log(`Total Newsletter Subscribers: ${subscribers.length}`);
  console.log(`Active Newsletter Subscribers: ${activeSubscribers}`);

  // Status breakdown for loan applications
  const loanStatusCount = await LoanApplication.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  console.log('\n📈 LOAN APPLICATION STATUS BREAKDOWN:');
  console.log('-'.repeat(40));
  loanStatusCount.forEach(status => {
    console.log(`   ${status._id}: ${status.count}`);
  });

  // Recent Activity (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentUsers = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });
  const recentLoans = await LoanApplication.countDocuments({ createdAt: { $gte: oneDayAgo } });
  const recentMessages = await ContactMessage.countDocuments({ createdAt: { $gte: oneDayAgo } });
  const recentSubscribers = await Newsletter.countDocuments({ createdAt: { $gte: oneDayAgo } });

  console.log('\n⏰ RECENT ACTIVITY (Last 24 hours):');
  console.log('-'.repeat(40));
  console.log(`New Users: ${recentUsers}`);
  console.log(`New Loan Applications: ${recentLoans}`);
  console.log(`New Contact Messages: ${recentMessages}`);
  console.log(`New Newsletter Subscribers: ${recentSubscribers}`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Database inspection completed successfully!');

  mongoose.connection.close();
};

// Run the inspection
inspectDatabase().catch(console.error);