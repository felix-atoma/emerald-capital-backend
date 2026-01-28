// test-endpoints-fixed.js
import axios from 'axios';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

// Load environment variables
config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

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
let blogId = '';
let blogSlug = '';
let commentId = '';
let adminToken = '';

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

const testAdminLogin = {
  username: 'adminuser',
  password: 'admin123'
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

const testBlogPost = {
  title: 'Test Blog Post - API Testing',
  excerpt: 'This is a test blog post created to test the blog API endpoints.',
  content: '<h1>Test Blog Content</h1><p>This blog post is used for testing the blog API functionality. It contains sample content to verify that all CRUD operations are working correctly.</p><p>The blog system should support rich text content, images, categories, and user interactions.</p>',
  category: 'Credit & Loans',
  author: 'John Doe',
  readTime: 5,
  tags: ['testing', 'api', 'blog'],
  isFeatured: false,
  isPublished: true,
  metaTitle: 'Test Blog Post - API Testing',
  metaDescription: 'A test blog post for API endpoint verification'
};

const testComment = {
  text: 'This is a test comment on the blog post.'
};

const testImagePath = path.join(process.cwd(), 'test-image.jpg');

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const printResult = (testName, success, message = '', error = null, data = null) => {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${testName}`);
  if (message) console.log(`   Message: ${message}`);
  if (error && !success) {
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
  }
  if (data && process.env.DEBUG === 'true') {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
  console.log('');
};

// Create authenticated API instance
const createAuthApi = (token) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

// Test functions
const testHealthCheck = async () => {
  try {
    const response = await api.get('/api/health');
    printResult('Health Check', true, response.data.message);
    return true;
  } catch (error) {
    printResult('Health Check', false, error.message, error, error.response?.data);
    return false;
  }
};

const testCorsDebug = async () => {
  try {
    const response = await api.get('/api/cors-debug');
    printResult('CORS Debug Endpoint', true, `Origin: ${response.data.requestOrigin || 'None'}`);
    return true;
  } catch (error) {
    printResult('CORS Debug Endpoint', false, error.message, error);
    return false;
  }
};

const testUploadsCheck = async () => {
  try {
    const response = await api.get('/api/uploads-check');
    const blogImages = response.data.blogImages;
    const fileExists = blogImages?.targetFile?.exists || false;
    const fileCount = blogImages?.files?.length || 0;
    
    printResult('Uploads Check Endpoint', true, 
      `Blog images: ${fileCount} files, Target exists: ${fileExists}`);
    return true;
  } catch (error) {
    printResult('Uploads Check Endpoint', false, error.message, error);
    return false;
  }
};

// FIXED: Upload endpoints with authentication
const testUploadInfo = async () => {
  try {
    if (!adminToken) {
      printResult('Upload Info Endpoint', false, 'No admin token available');
      return false;
    }
    
    const authApi = createAuthApi(adminToken);
    const response = await authApi.get('/api/upload/info');
    const maxSize = response.data.data?.maxFileSize || 'Unknown';
    const serverUrl = response.data.data?.serverUrl || 'Unknown';
    
    printResult('Upload Info Endpoint', true, 
      `Max file size: ${maxSize}, Server: ${serverUrl.split('//').pop()}`);
    return true;
  } catch (error) {
    printResult('Upload Info Endpoint', false, error.message, error);
    return false;
  }
};

const testAdminLoginEndpoint = async () => {
  try {
    const response = await api.post('/api/admin/login', testAdminLogin);
    adminToken = response.data.data?.tokens?.access || response.data.token;
    
    if (adminToken) {
      printResult('Admin Login', true, 'Admin logged in successfully');
      return true;
    } else {
      printResult('Admin Login', false, 'No token received', null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Admin Login', false, error.response?.data?.message || error.message, error, error.response?.data);
    return false;
  }
};

const testUploadDebugDirs = async () => {
  try {
    if (!adminToken) {
      printResult('Upload Debug Directories', false, 'No admin token available');
      return false;
    }
    
    const authApi = createAuthApi(adminToken);
    const response = await authApi.get('/api/upload/debug-dirs');
    const directories = response.data.directories || {};
    const blogImages = directories['blog-images'];
    const blogFiles = blogImages?.files?.length || 0;
    
    printResult('Upload Debug Directories', true, 
      `Blog images dir: ${blogFiles} files, Path: ${blogImages?.path?.split('/').pop()}`);
    return true;
  } catch (error) {
    printResult('Upload Debug Directories', false, error.message, error);
    return false;
  }
};

const testUploadListFiles = async () => {
  try {
    if (!adminToken) {
      printResult('Upload List Files', false, 'No admin token available');
      return false;
    }
    
    const authApi = createAuthApi(adminToken);
    const response = await authApi.get('/api/upload/list/blog-images');
    const fileCount = response.data.fileCount || 0;
    const pathInfo = response.data.path || '';
    
    printResult('Upload List Files', true, 
      `${fileCount} files in blog-images, Path: ${pathInfo.split('/').pop()}`);
    return true;
  } catch (error) {
    printResult('Upload List Files', false, error.message, error);
    return false;
  }
};

const testUploadCreateTestFile = async () => {
  try {
    if (!adminToken) {
      printResult('Upload Test File Creation', false, 'No admin token available');
      return false;
    }
    
    const authApi = createAuthApi(adminToken);
    const response = await authApi.get('/api/upload/test-create');
    const fileCreated = response.data.success || false;
    const fullUrl = response.data.fullUrl || '';
    
    printResult('Upload Test File Creation', fileCreated, 
      fileCreated ? `File created: ${fullUrl.split('/').pop()}` : 'Failed to create test file');
    return fileCreated;
  } catch (error) {
    printResult('Upload Test File Creation', false, error.message, error);
    return false;
  }
};

// User registration function
const testUserRegistration = async () => {
  try {
    const response = await api.post('/api/auth/register', testUser);
    
    if (response.data.success && response.data.data) {
      authToken = response.data.data.tokens?.accessToken || response.data.data.token;
      userId = response.data.data.user?._id || response.data.data._id;
      
      if (authToken) {
        printResult('User Registration', true, 'User registered successfully');
        return true;
      }
    }
    
    printResult('User Registration', false, 'Invalid response structure', null, response.data);
    return false;
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    if (error.response?.status === 400 && errorMessage.includes('already exists')) {
      printResult('User Registration', true, 'User already exists, trying login...');
      return await testUserLogin();
    }
    printResult('User Registration', false, errorMessage, error, error.response?.data);
    return false;
  }
};

// User login function
const testUserLogin = async () => {
  try {
    const response = await api.post('/api/auth/login', testLogin);
    
    if (response.data.success && response.data.data) {
      authToken = response.data.data.tokens?.accessToken || response.data.data.token;
      userId = response.data.data.user?._id || response.data.data._id;
      
      if (authToken) {
        printResult('User Login', true, 'User logged in successfully');
        return true;
      }
    }
    
    printResult('User Login', false, 'Invalid response structure', null, response.data);
    return false;
    
  } catch (error) {
    printResult('User Login', false, error.response?.data?.message || error.message, error, error.response?.data);
    return false;
  }
};

// Profile test function
const testGetProfile = async () => {
  try {
    if (!authToken) {
      printResult('Get Profile', false, 'No user token available');
      return false;
    }
    
    const authApi = createAuthApi(authToken);
    const response = await authApi.get('/api/auth/profile');
    const username = response.data.data?.user?.username || response.data.data?.username || 'N/A';
    printResult('Get Profile', true, `Profile for: ${username}`);
    return true;
  } catch (error) {
    printResult('Get Profile', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

// Account tests
const testGetAccountBalance = async () => {
  try {
    if (!authToken) {
      printResult('Get Account Balance', false, 'No user token available');
      return false;
    }
    
    const authApi = createAuthApi(authToken);
    const response = await authApi.get('/api/account/balance');
    const balance = response.data.data?.balance || 'N/A';
    printResult('Get Account Balance', true, `Balance: GHS ${balance}`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      printResult('Get Account Balance', false, 'Endpoint not found (might be disabled)', error);
    } else {
      printResult('Get Account Balance', false, error.response?.data?.message || error.message, error);
    }
    return false;
  }
};

const testGetAccountDetails = async () => {
  try {
    if (!authToken) {
      printResult('Get Account Details', false, 'No user token available');
      return false;
    }
    
    const authApi = createAuthApi(authToken);
    const response = await authApi.get('/api/account/details');
    const accountNumber = response.data.data?.account?.accountNumber || 'N/A';
    recipientAccountNumber = accountNumber;
    printResult('Get Account Details', true, `Account: ${accountNumber}`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      printResult('Get Account Details', false, 'Endpoint not found (might be disabled)', error);
    } else {
      printResult('Get Account Details', false, error.response?.data?.message || error.message, error);
    }
    return false;
  }
};

// Blog tests
const testGetPublicBlogs = async () => {
  try {
    const response = await api.get('/api/blogs');
    
    let blogCount = 0;
    if (response.data.data) {
      blogCount = response.data.data.blogs?.length || response.data.data.length || 0;
    }
    
    printResult('Get Public Blogs', true, `Found ${blogCount} blogs`);
    return true;
  } catch (error) {
    printResult('Get Public Blogs', false, error.response?.data?.message || error.message, error, error.response?.data);
    return false;
  }
};

const testGetPopularBlogs = async () => {
  try {
    const response = await api.get('/api/blogs/popular?limit=3');
    
    if (response.data && response.data.success) {
      const blogs = response.data.data || response.data.data?.blogs || [];
      const blogCount = Array.isArray(blogs) ? blogs.length : 0;
      printResult('Get Popular Blogs', true, `Found ${blogCount} popular blogs`);
      return true;
    } else {
      printResult('Get Popular Blogs', false, 'Invalid response format from server', null, response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      printResult('Get Popular Blogs', false, 'Endpoint not found (might be disabled)', error);
    } else {
      printResult('Get Popular Blogs', false, error.response?.data?.message || error.message, error);
    }
    return false;
  }
};

const testCreateBlogPost = async () => {
  try {
    if (!adminToken) {
      printResult('Create Blog Post', false, 'No admin token available');
      return false;
    }
    
    const authApi = createAuthApi(adminToken);
    const response = await authApi.post('/api/blogs', testBlogPost);
    
    if (response.data.success) {
      blogId = response.data.data?._id || response.data.data?.blog?._id;
      blogSlug = response.data.data?.slug || response.data.data?.blog?.slug;
      printResult('Create Blog Post', true, `Blog created with ID: ${blogId}`);
      return true;
    } else {
      printResult('Create Blog Post', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Create Blog Post', false, error.response?.data?.message || error.message, error, error.response?.data);
    return false;
  }
};

const testGetSingleBlog = async () => {
  try {
    // First get a blog to test with
    const blogsResponse = await api.get('/api/blogs?limit=1');
    
    let testBlogSlug = blogSlug;
    if (!testBlogSlug && blogsResponse.data.success) {
      const blogs = blogsResponse.data.data?.blogs || blogsResponse.data.data || [];
      if (blogs.length > 0) {
        testBlogSlug = blogs[0].slug || blogs[0]._id;
      }
    }
    
    if (!testBlogSlug) {
      printResult('Get Single Blog', false, 'No blogs available to test');
      return false;
    }
    
    const response = await api.get(`/api/blogs/${testBlogSlug}`);
    const title = response.data.data?.title || 'Unknown';
    printResult('Get Single Blog', true, `Blog retrieved: ${title}`);
    return true;
  } catch (error) {
    printResult('Get Single Blog', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

// Loan tests
const testCreateLoanApplication = async () => {
  try {
    if (!authToken) {
      printResult('Create Loan Application', false, 'No user token available');
      return false;
    }
    
    const authApi = createAuthApi(authToken);
    const response = await authApi.post('/api/loans/applications', testLoanApplication);
    if (response.data.success) {
      loanApplicationId = response.data.data?._id || response.data.data?.loanApplication?._id;
      printResult('Create Loan Application', true, 'Loan application created successfully');
      return true;
    } else {
      printResult('Create Loan Application', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Create Loan Application', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

const testGetMyLoanApplications = async () => {
  try {
    if (!authToken) {
      printResult('Get My Loan Applications', false, 'No user token available');
      return false;
    }
    
    const authApi = createAuthApi(authToken);
    const response = await authApi.get('/api/loans/applications');
    if (response.data.success) {
      const apps = response.data.data?.loanApplications || response.data.data || [];
      const count = Array.isArray(apps) ? apps.length : 0;
      printResult('Get My Loan Applications', true, `Found ${count} applications`);
      return true;
    } else {
      printResult('Get My Loan Applications', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Get My Loan Applications', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

// Contact tests
const testSubmitContactMessage = async () => {
  try {
    const response = await api.post('/api/contact', testContactMessage);
    if (response.data.success) {
      contactMessageId = response.data.data?._id || response.data.data?.message?._id;
      printResult('Submit Contact Message', true, 'Contact message submitted successfully');
      return true;
    } else {
      printResult('Submit Contact Message', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Submit Contact Message', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

const testNewsletterSubscription = async () => {
  try {
    const response = await api.post('/api/newsletter/subscribe', testNewsletter);
    if (response.data.success) {
      printResult('Newsletter Subscription', true, 'Newsletter subscription successful');
      return true;
    } else {
      if (response.data.message?.includes('already subscribed') || response.data.message?.includes('already exists')) {
        printResult('Newsletter Subscription', true, 'Email already subscribed (expected)');
        return true;
      }
      printResult('Newsletter Subscription', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already subscribed')) {
      printResult('Newsletter Subscription', true, 'Email already subscribed (expected)');
      return true;
    }
    printResult('Newsletter Subscription', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

// Image upload test
const testImageUpload = async () => {
  try {
    if (!adminToken) {
      printResult('Image Upload', false, 'Admin token not available');
      return false;
    }

    // Create a test image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️  Creating test image file...');
      const testImage = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      fs.writeFileSync(testImagePath, testImage);
      console.log('✅ Test image file created');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));

    // Make the request
    const response = await axios.post(
      `${API_BASE_URL}/api/upload/image?type=blog`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          ...formData.getHeaders()
        }
      }
    );

    if (response.data.success) {
      const filename = response.data.data?.filename || 'Unknown';
      const fileUrl = response.data.data?.url || '';
      printResult('Image Upload', true, 
        `File uploaded: ${filename}, URL: ${fileUrl.split('/').pop()}`);
      return true;
    } else {
      printResult('Image Upload', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Image Upload', false, error.response?.data?.message || error.message, error, error.response?.data);
    return false;
  }
};

// Admin dashboard test
const testAdminDashboard = async () => {
  try {
    if (!adminToken) {
      printResult('Admin Dashboard', false, 'No admin token available');
      return false;
    }
    
    const authApi = createAuthApi(adminToken);
    const response = await authApi.get('/api/admin/dashboard');
    if (response.data.success) {
      const stats = response.data.data?.stats || {};
      printResult('Admin Dashboard', true, 'Dashboard stats retrieved');
      console.log('   Stats:', JSON.stringify(stats, null, 2));
      return true;
    } else {
      printResult('Admin Dashboard', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Admin Dashboard', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Emerald Capital Backend Endpoint Tests\n');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Basic connectivity
    console.log('\n🔗 Testing Basic Connectivity...\n');
    await testHealthCheck();
    await delay(500);
    
    // Step 2: Debug endpoints (no auth needed)
    console.log('\n🔧 Testing Debug Endpoints...\n');
    await testCorsDebug();
    await delay(300);
    await testUploadsCheck();
    await delay(300);
    
    // Step 3: Admin login
    console.log('\n👑 Testing Admin Login...\n');
    const adminLoggedIn = await testAdminLoginEndpoint();
    await delay(500);
    
    // Step 4: Upload endpoints (need admin auth)
    if (adminLoggedIn) {
      console.log('\n📁 Testing Upload Directories...\n');
      await testUploadInfo();
      await delay(300);
      await testUploadDebugDirs();
      await delay(300);
      await testUploadListFiles();
      await delay(300);
      await testUploadCreateTestFile();
      await delay(500);
    }
    
    // Step 5: User registration/login
    console.log('\n👤 Testing User Authentication...\n');
    const userRegistered = await testUserRegistration();
    await delay(500);
    
    // Step 6: Profile test
    if (userRegistered) {
      console.log('\n📋 Testing Profile Endpoints...\n');
      await testGetProfile();
      await delay(500);
    }
    
    // Step 7: Account tests
    if (userRegistered) {
      console.log('\n💰 Testing Account Endpoints...\n');
      await testGetAccountBalance();
      await delay(300);
      await testGetAccountDetails();
      await delay(300);
    }
    
    // Step 8: Loan tests
    if (userRegistered) {
      console.log('\n🏦 Testing Loan Endpoints...\n');
      await testCreateLoanApplication();
      await delay(500);
      await testGetMyLoanApplications();
      await delay(500);
    }
    
    // Step 9: Contact tests (no auth needed)
    console.log('\n📧 Testing Contact Endpoints...\n');
    await testSubmitContactMessage();
    await delay(500);
    await testNewsletterSubscription();
    await delay(500);
    
    // Step 10: Blog public tests (no auth needed)
    console.log('\n📝 Testing Public Blog Endpoints...\n');
    await testGetPublicBlogs();
    await delay(500);
    await testGetPopularBlogs();
    await delay(500);
    await testGetSingleBlog();
    await delay(500);
    
    // Step 11: Admin blog tests
    if (adminLoggedIn) {
      console.log('\n👨‍💼 Testing Admin Blog Functions...\n');
      await testCreateBlogPost();
      await delay(500);
      
      console.log('\n🖼️  Testing Image Upload...\n');
      await testImageUpload();
      await delay(500);
      
      console.log('\n📊 Testing Admin Dashboard...\n');
      await testAdminDashboard();
      await delay(500);
    } else {
      console.log('\n⚠️  Skipping admin tests - admin login failed');
    }
    
    console.log('='.repeat(60));
    console.log('\n🎉 All tests completed!');
    console.log('\n📊 Summary:');
    console.log(`   • Admin Login: ${adminLoggedIn ? '✅ Success' : '❌ Failed'}`);
    console.log(`   • User Registration: ${userRegistered ? '✅ Success' : '❌ Failed'}`);
    console.log(`   • Upload Directories: ${adminLoggedIn ? '✅ Tested' : '❌ Skipped'}`);
    console.log(`   • Blog System: ${adminLoggedIn ? '✅ Tested' : '❌ Skipped'}`);
    
  } catch (error) {
    console.error('\n❌ Test runner error:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});