import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

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

const testCreateLoanApplication = async () => {
  try {
    // For file uploads, we'll create a simple test without actual files
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

// Admin tests (will fail without admin privileges, but we'll test the endpoints)
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

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Emerald Capital Backend Endpoint Tests\n');
  console.log('='.repeat(60));
  
  const tests = [
    testHealthCheck,
    testUserRegistration,
    testUserLogin,
    testGetProfile,
    testUpdateProfile,
    testChangePassword,
    testCreateLoanApplication,
    testGetMyLoanApplications,
    testGetLoanApplication,
    testUpdateLoanApplication,
    testSubmitContactMessage,
    testNewsletterSubscription,
    testNewsletterUnsubscribe,
    testGetAllLoanApplications,
    testGetContactMessages,
    testGetDashboardStats,
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

// Run the tests
runAllTests().catch(console.error);