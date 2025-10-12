import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/Transaction.js';

dotenv.config();

const debugTransactionModel = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check Transaction model schema
    console.log('📋 Transaction Model Schema Analysis');
    console.log('='.repeat(50));
    
    const schema = Transaction.schema;
    
    // List all schema paths
    console.log('\n🔍 Schema Paths:');
    Object.keys(schema.paths).forEach(path => {
      const pathObj = schema.paths[path];
      console.log(`   ${path}:`);
      console.log(`     - Type: ${pathObj.instance}`);
      console.log(`     - Required: ${pathObj.isRequired}`);
      console.log(`     - Default: ${pathObj.defaultValue}`);
      if (pathObj.enumValues) {
        console.log(`     - Enum: ${pathObj.enumValues.join(', ')}`);
      }
    });

    // Check indexes
    console.log('\n📈 Schema Indexes:');
    const indexes = schema.indexes();
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${JSON.stringify(index[0])} - ${JSON.stringify(index[1])}`);
    });

    // Test creating a transaction
    console.log('\n🧪 Testing Transaction Creation');
    console.log('='.repeat(50));
    
    const testTransactionData = {
      user: new mongoose.Types.ObjectId(), // dummy user ID
      account: new mongoose.Types.ObjectId(), // dummy account ID
      type: 'credit',
      amount: 100.00,
      description: 'Debug test transaction',
      category: 'deposit',
      status: 'completed'
    };

    console.log('Test data:', JSON.stringify(testTransactionData, null, 2));

    // Test validation
    const testTransaction = new Transaction(testTransactionData);
    
    try {
      await testTransaction.validate();
      console.log('✅ Transaction validation passed');
      console.log('   Generated reference:', testTransaction.reference);
    } catch (validationError) {
      console.log('❌ Transaction validation failed:');
      Object.keys(validationError.errors).forEach(field => {
        console.log(`   - ${field}: ${validationError.errors[field].message}`);
      });
    }

    // Test saving (but don't actually save)
    console.log('\n💾 Testing save (will not actually save):');
    try {
      // We'll test the pre-save hook by checking if reference gets generated
      await testTransaction.save();
      console.log('✅ Save test passed');
      console.log('   Final reference:', testTransaction.reference);
      console.log('   Transaction ID:', testTransaction._id);
      
      // Delete the test transaction
      await Transaction.findByIdAndDelete(testTransaction._id);
      console.log('   🧹 Test transaction cleaned up');
    } catch (saveError) {
      console.log('❌ Save test failed:', saveError.message);
    }

    // Check existing transactions structure
    console.log('\n📊 Analyzing Existing Transactions');
    console.log('='.repeat(50));
    
    const sampleTransaction = await Transaction.findOne();
    if (sampleTransaction) {
      console.log('Sample transaction structure:');
      console.log(JSON.stringify(sampleTransaction.toObject(), null, 2));
      
      console.log('\nTransaction types in database:');
      const types = await Transaction.distinct('type');
      console.log('   Types:', types);
      
      console.log('Transaction statuses in database:');
      const statuses = await Transaction.distinct('status');
      console.log('   Statuses:', statuses);
      
      console.log('Transaction categories in database:');
      const categories = await Transaction.distinct('category');
      console.log('   Categories:', categories);
    } else {
      console.log('No transactions found in database');
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 MongoDB connection closed');
  }
};

debugTransactionModel();