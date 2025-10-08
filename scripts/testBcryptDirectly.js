// scripts/testBcryptDirectly.js
import bcrypt from 'bcryptjs';

async function testBcryptDirectly() {
  console.log('🔍 Testing bcrypt directly:');
  
  // Test 1: Hash and compare the same password
  console.log('\n🧪 Test 1: Hash and compare same password');
  const testPassword = 'admin123';
  const hash = await bcrypt.hash(testPassword, 12);
  console.log(`   Password: "${testPassword}"`);
  console.log(`   Generated hash: ${hash}`);
  console.log(`   Hash length: ${hash.length}`);
  console.log(`   Is valid bcrypt: ${hash.startsWith('$2a$') || hash.startsWith('$2b$')}`);
  
  const match = await bcrypt.compare(testPassword, hash);
  console.log(`   Direct comparison: ${match ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  // Test 2: Test with wrong password
  console.log('\n🧪 Test 2: Test with wrong password');
  const wrongMatch = await bcrypt.compare('wrongpassword', hash);
  console.log(`   Wrong password comparison: ${wrongMatch ? '❌ WRONG' : '✅ CORRECTLY REJECTED'}`);
  
  // Test 3: Test the exact hashes we have in the database
  console.log('\n🧪 Test 3: Test exact database hashes');
  const adminHash = '$2a$12$UBiu63XblSkUQ1l6qdO9AuVxW.hw2N.yqf9TSNWHPUiYfZpGgaSBm';
  const testUserHash = '$2a$12$HeDMi24f0EU4JWW/5E6nmeWiqqTaVIAYBxYLfTualSWU.qTz02m1a';
  
  const adminMatch = await bcrypt.compare('admin123', adminHash);
  console.log(`   Admin hash comparison: ${adminMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  const testUserMatch = await bcrypt.compare('test123456', testUserHash);
  console.log(`   Test user hash comparison: ${testUserMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
}

testBcryptDirectly();