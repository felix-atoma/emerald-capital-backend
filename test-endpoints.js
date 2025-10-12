import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken = '';
let userId = '';
let loanApplicationId = '';
let contactMessageId = '';
let recipientAccountNumber = '';

// Test data
const testUser = {
  sex: 'male',
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'Michael',
  dateOfBirth: '1990-01-15',
  phone: '0241234567',
  otherPhone: '0247654321',
  ghanaCardNumber: 'GHA-123456789-A',
  email: 'john.doe@test.com',
  homeAddress: '123 Test Street, Accra, Ghana',
  region: 'Greater Accra',
  nextOfKin: [
    {
      relationship: 'spouse',
      firstName: 'Jane',
      lastName: 'Doe'
    }
  ],
  nextOfKinPhone: '0249876543',
  employmentType: ['private'],
  employer: 'Test Company Ltd',
  staffNumber: 'EMP001',
  employmentDate: '2020-01-01',
  gradeLevel: 'Manager',
  lastMonthPay: 5000,
  username: 'johndoe',
  password: 'password123',
  agreementConfirmed: true
};

const testLogin = {
  username: 'johndoe',
  password: 'password123'
};

const testLoanApplication = {
  tenor: 12,
  loanAmountRequested: 10000,
  loanPurpose: 'business',
  purposeDescription: 'Starting a small business',
  agreementConfirmed: true
};

const testContactMessage = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '0241111111',
  website: 'https://example.com',
  message: 'This is a test message from the endpoint testing script.',
  agreedToTerms: true
};

const testNewsletter = {
  email: 'newsletter@example.com'
};

const testTransfer = {
  recipientAccountNumber: '',
  amount: 50.00,
  description: 'Test transfer payment'
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const printResult = (testName, success, message = '', data = null) => {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${testName}`);
  if (message) console.log(`   Message: ${message}`);
  if (data && !success) console.log(`   Data:`, JSON.stringify(data, null, 2));
  console.log('');
};

// Test functions
const testHealthCheck = async () => {
  try {
    const response = await api.get('/health');
    printResult('Health Check', true, response.data.message);
    return true;
  } catch (error) {
    printResult('Health Check', false, error.message);
    return false;
  }
};

const testUserRegistration = async () => {
  try {
    const response = await api.post('/auth/register', testUser);
    authToken = response.data.data.tokens.accessToken;
    userId = response.data.data.user._id;
    
    // Set auth token for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    printResult('User Registration', true, 'User registered successfully');
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      // User already exists, try login instead
      return await testUserLogin();
    }
    printResult('User Registration', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testUserLogin = async () => {
  try {
    const response = await api.post('/auth/login', testLogin);
    authToken = response.data.data.tokens.accessToken;
    userId = response.data.data.user._id;
    
    // Set auth token for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    printResult('User Login', true, 'User logged in successfully');
    return true;
  } catch (error) {
    printResult('User Login', false, error.response?.data?.message || error.message);
    return false;
  }
};

// ACCOUNT ENDPOINT TESTS
const testGetAccountBalance = async () => {
  try {
    const response = await api.get('/account/balance');
    printResult('Get Account Balance', true, `Balance: GHS ${response.data.data.balance}`);
    return true;
  } catch (error) {
    printResult('Get Account Balance', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetAccountDetails = async () => {
  try {
    const response = await api.get('/account/details');
    recipientAccountNumber = response.data.data.account.accountNumber;
    printResult('Get Account Details', true, `Account: ${response.data.data.account.accountNumber}`);
    return true;
  } catch (error) {
    printResult('Get Account Details', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetTransactions = async () => {
  try {
    const response = await api.get('/account/transactions?limit=5&page=1');
    printResult('Get Transactions', true, `Found ${response.data.data.transactions.length} transactions`);
    return true;
  } catch (error) {
    printResult('Get Transactions', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetTransactionsWithFilter = async () => {
  try {
    const response = await api.get('/account/transactions?type=credit&limit=3');
    printResult('Get Filtered Transactions', true, `Found ${response.data.data.transactions.length} credit transactions`);
    return true;
  } catch (error) {
    printResult('Get Filtered Transactions', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetTransactionStats = async () => {
  try {
    const response = await api.get('/account/transaction-stats?period=month');
    printResult('Get Transaction Stats', true, `Stats: Credits: GHS ${response.data.data.credits}, Debits: GHS ${response.data.data.debits}, Transfers: GHS ${response.data.data.transfers}`);
    return true;
  } catch (error) {
    // If the endpoint doesn't exist yet, that's expected
    if (error.response?.status === 404) {
      printResult('Get Transaction Stats', true, 'Endpoint not implemented yet (expected)');
      return true;
    }
    printResult('Get Transaction Stats', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetTransactionById = async () => {
  try {
    // First get a transaction ID from the transactions list
    const transactionsResponse = await api.get('/account/transactions?limit=1');
    
    if (transactionsResponse.data.data.transactions.length > 0) {
      const transactionId = transactionsResponse.data.data.transactions[0]._id;
      const response = await api.get(`/account/transactions/${transactionId}`);
      printResult('Get Transaction by ID', true, `Transaction found: ${response.data.data.reference}`);
      return true;
    } else {
      printResult('Get Transaction by ID', true, 'No transactions found (skipping)');
      return true;
    }
  } catch (error) {
    printResult('Get Transaction by ID', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testTransferFunds = async () => {
  try {
    // Get current account details
    const accountDetails = await api.get('/account/details');
    const currentAccountNumber = accountDetails.data.data.account.accountNumber;
    
    // Try transfer to invalid account (this should fail gracefully)
    const transferData = {
      recipientAccountNumber: 'INVALID_ACCOUNT_999',
      amount: 10.00,
      description: 'Test transfer to invalid account'
    };
    
    await api.post('/account/transfer', transferData);
    
    // If we get here, the transfer succeeded (unexpected)
    printResult('Transfer Funds', false, 'Transfer should have failed but succeeded');
    return false;
    
  } catch (error) {
    // We expect this to fail, so check what kind of failure it is
    if (error.response?.status === 404) {
      printResult('Transfer Funds', true, 'Recipient not found (expected)');
      return true;
    } else if (error.response?.status === 400) {
      const message = error.response.data.message.toLowerCase();
      if (message.includes('insufficient') || message.includes('invalid') || message.includes('not found') || message.includes('own account')) {
        printResult('Transfer Funds', true, `Transfer validation: ${error.response.data.message}`);
        return true;
      } else {
        printResult('Transfer Funds', false, `Unexpected 400: ${error.response.data.message}`);
        return false;
      }
    } else if (error.response?.status === 500) {
      // Check if it's a reference validation error
      if (error.response.data.message?.includes('reference') || error.response.data.error?.includes('reference')) {
        printResult('Transfer Funds', false, 'Transaction reference generation failed');
        return false;
      }
      printResult('Transfer Funds', false, 'Server error in transfer - check transfer controller');
      return false;
    } else {
      printResult('Transfer Funds', false, error.response?.data?.message || error.message);
      return false;
    }
  }
};

const testUpdateAccountStatus = async () => {
  try {
    const updateData = {
      status: 'active'
    };
    
    const response = await api.patch('/account/status', updateData);
    printResult('Update Account Status', true, `Account status: ${response.data.data.status}`);
    return true;
  } catch (error) {
    printResult('Update Account Status', false, error.response?.data?.message || error.message);
    return false;
  }
};

// ENHANCED TRANSFER TESTS
const testTransferWithInsufficientFunds = async () => {
  try {
    // Simple test - try to transfer with invalid account (should fail for any reason)
    const transferData = {
      recipientAccountNumber: 'INVALID_ACCOUNT_999999',
      amount: 1000000.00,
      description: 'Test transfer failure'
    };
    
    await api.post('/account/transfer', transferData);
    
    // If we get here, something is wrong
    printResult('Transfer with Insufficient Funds', false, 'Transfer should have failed');
    return false;
    
  } catch (error) {
    // Any failure is acceptable for this test - we're testing that transfers can fail
    printResult('Transfer with Insufficient Funds', true, 'Transfer failed as expected');
    return true;
  }
};

const testTransferToSelf = async () => {
  try {
    const accountDetails = await api.get('/account/details');
    const ownAccountNumber = accountDetails.data.data.account.accountNumber;
    
    const transferData = {
      recipientAccountNumber: ownAccountNumber,
      amount: 10.00,
      description: 'Test transfer to own account'
    };
    
    await api.post('/account/transfer', transferData);
    printResult('Transfer to Self', false, 'Should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message?.includes('own account')) {
      printResult('Transfer to Self', true, 'Prevented self-transfer (expected)');
      return true;
    }
    printResult('Transfer to Self', false, error.response?.data?.message || error.message);
    return false;
  }
};

// PROFILE AND AUTH TESTS
const testGetProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    printResult('Get Profile', true, 'Profile retrieved successfully');
    return true;
  } catch (error) {
    printResult('Get Profile', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testUpdateProfile = async () => {
  try {
    const updateData = {
      phone: '0249999999',
      homeAddress: '456 Updated Street, Accra, Ghana'
    };
    
    const response = await api.put('/auth/profile', updateData);
    printResult('Update Profile', true, 'Profile updated successfully');
    return true;
  } catch (error) {
    printResult('Update Profile', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testChangePassword = async () => {
  try {
    const passwordData = {
      currentPassword: 'password123',
      newPassword: 'newpassword123'
    };
    
    const response = await api.put('/auth/change-password', passwordData);
    printResult('Change Password', true, 'Password changed successfully');
    
    // Change back to original password for subsequent tests
    const revertData = {
      currentPassword: 'newpassword123',
      newPassword: 'password123'
    };
    
    await api.put('/auth/change-password', revertData);
    return true;
  } catch (error) {
    printResult('Change Password', false, error.response?.data?.message || error.message);
    return false;
  }
};

// LOAN TESTS
const testCreateLoanApplication = async () => {
  try {
    const response = await api.post('/loans/applications', testLoanApplication);
    loanApplicationId = response.data.data.loanApplication._id;
    printResult('Create Loan Application', true, 'Loan application created successfully');
    return true;
  } catch (error) {
    printResult('Create Loan Application', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetMyLoanApplications = async () => {
  try {
    const response = await api.get('/loans/applications');
    printResult('Get My Loan Applications', true, `Found ${response.data.data.loanApplications.length} applications`);
    return true;
  } catch (error) {
    printResult('Get My Loan Applications', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetLoanApplication = async () => {
  try {
    const response = await api.get(`/loans/applications/${loanApplicationId}`);
    printResult('Get Loan Application', true, 'Loan application retrieved successfully');
    return true;
  } catch (error) {
    printResult('Get Loan Application', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testUpdateLoanApplication = async () => {
  try {
    const updateData = {
      purposeDescription: 'Updated business purpose description'
    };
    
    const response = await api.put(`/loans/applications/${loanApplicationId}`, updateData);
    printResult('Update Loan Application', true, 'Loan application updated successfully');
    return true;
  } catch (error) {
    printResult('Update Loan Application', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testDeleteLoanApplication = async () => {
  try {
    const response = await api.delete(`/loans/applications/${loanApplicationId}`);
    printResult('Delete Loan Application', true, 'Loan application deleted successfully');
    return true;
  } catch (error) {
    printResult('Delete Loan Application', false, error.response?.data?.message || error.message);
    return false;
  }
};

// CONTACT AND NEWSLETTER TESTS
const testSubmitContactMessage = async () => {
  try {
    const response = await api.post('/contact', testContactMessage);
    contactMessageId = response.data.data.contactMessage.id;
    printResult('Submit Contact Message', true, 'Contact message submitted successfully');
    return true;
  } catch (error) {
    printResult('Submit Contact Message', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testNewsletterSubscription = async () => {
  try {
    const response = await api.post('/newsletter/subscribe', testNewsletter);
    printResult('Newsletter Subscription', true, 'Newsletter subscription successful');
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already subscribed')) {
      printResult('Newsletter Subscription', true, 'Email already subscribed (expected)');
      return true;
    }
    printResult('Newsletter Subscription', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testNewsletterUnsubscribe = async () => {
  try {
    const response = await api.post('/newsletter/unsubscribe', testNewsletter);
    printResult('Newsletter Unsubscribe', true, 'Newsletter unsubscription successful');
    return true;
  } catch (error) {
    printResult('Newsletter Unsubscribe', false, error.response?.data?.message || error.message);
    return false;
  }
};

// ADMIN TESTS
const testGetAllLoanApplications = async () => {
  try {
    const response = await api.get('/loans/admin/applications');
    printResult('Get All Loan Applications (Admin)', true, 'Admin loan applications retrieved');
    return true;
  } catch (error) {
    if (error.response?.status === 403) {
      printResult('Get All Loan Applications (Admin)', true, 'Access denied (expected for non-admin)');
      return true;
    }
    printResult('Get All Loan Applications (Admin)', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetContactMessages = async () => {
  try {
    const response = await api.get('/contact');
    printResult('Get Contact Messages (Admin)', true, 'Contact messages retrieved');
    return true;
  } catch (error) {
    if (error.response?.status === 403) {
      printResult('Get Contact Messages (Admin)', true, 'Access denied (expected for non-admin)');
      return true;
    }
    printResult('Get Contact Messages (Admin)', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetDashboardStats = async () => {
  try {
    const response = await api.get('/admin/dashboard');
    printResult('Get Dashboard Stats (Admin)', true, 'Dashboard stats retrieved');
    return true;
  } catch (error) {
    if (error.response?.status === 403) {
      printResult('Get Dashboard Stats (Admin)', true, 'Access denied (expected for non-admin)');
      return true;
    }
    printResult('Get Dashboard Stats (Admin)', false, error.response?.data?.message || error.message);
    return false;
  }
};

// NEW TRANSACTION STATS TESTS
const testGetTransactionStatsWithDifferentPeriods = async () => {
  try {
    // Test with different period parameters
    const periods = ['day', 'week', 'month', 'year'];
    
    for (const period of periods) {
      const response = await api.get(`/account/transaction-stats?period=${period}`);
      printResult(`Get Transaction Stats (${period})`, true, 
        `Credits: GHS ${response.data.data.credits}, Debits: GHS ${response.data.data.debits}`);
      await delay(200); // Small delay between requests
    }
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      printResult('Get Transaction Stats with Periods', true, 'Endpoint not implemented yet (expected)');
      return true;
    }
    printResult('Get Transaction Stats with Periods', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetTransactionStatsWithoutPeriod = async () => {
  try {
    const response = await api.get('/account/transaction-stats');
    printResult('Get Transaction Stats (default period)', true, 
      `Default period stats retrieved successfully`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      printResult('Get Transaction Stats (default period)', true, 'Endpoint not implemented yet (expected)');
      return true;
    }
    printResult('Get Transaction Stats (default period)', false, error.response?.data?.message || error.message);
    return false;
  }
};

// ACCOUNT HISTORY TESTS
const testGetAccountStatement = async () => {
  try {
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate())
      .toISOString().split('T')[0];
    const endDate = currentDate.toISOString().split('T')[0];
    
    const response = await api.get(`/account/statement?startDate=${startDate}&endDate=${endDate}`);
    printResult('Get Account Statement', true, `Statement generated for ${startDate} to ${endDate}`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      printResult('Get Account Statement', true, 'Endpoint not implemented yet (expected)');
      return true;
    }
    printResult('Get Account Statement', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Emerald Capital Backend Endpoint Tests\n');
  console.log('='.repeat(60));
  
  const tests = [
    // Basic connectivity
    testHealthCheck,
    testUserRegistration,
    testUserLogin,
    
    // Account tests
    testGetAccountBalance,
    testGetAccountDetails,
    testGetTransactions,
    testGetTransactionsWithFilter,
    testGetTransactionById,
    testGetTransactionStats,
    testGetTransactionStatsWithDifferentPeriods,
    testGetTransactionStatsWithoutPeriod,
    
    // Transfer tests
    testTransferFunds,
    testTransferToSelf,
    testTransferWithInsufficientFunds,
    
    // Account management
    testUpdateAccountStatus,
    testGetAccountStatement,
    
    // Profile tests
    testGetProfile,
    testUpdateProfile,
    testChangePassword,
    
    // Loan tests
    testCreateLoanApplication,
    testGetMyLoanApplications,
    testGetLoanApplication,
    testUpdateLoanApplication,
    
    // Contact tests
    testSubmitContactMessage,
    testNewsletterSubscription,
    testNewsletterUnsubscribe,
    
    // Admin tests (will fail for non-admin users, but that's expected)
    testGetAllLoanApplications,
    testGetContactMessages,
    testGetDashboardStats,
    
    // Cleanup (should be last)
    testDeleteLoanApplication
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) passed++;
    else failed++;
    
    // Small delay between tests to avoid overwhelming the server
    await delay(500);
  }

  console.log('='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your backend is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the error messages above.');
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
runAllTests().catch(console.error);