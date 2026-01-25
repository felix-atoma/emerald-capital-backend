// test-endpoints-fixed.js
import axios from 'axios';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

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

// FIXED: Test data aligned with User schema
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

// Admin login data (use your seed admin credentials)
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

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const printResult = (testName, success, message = '', error = null, data = null) => {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${testName}`);
  if (message) console.log(`   Message: ${message}`);
  if (error && !success) {
    console.log(`   Error Details:`, error.response?.data || error.message);
  }
  if (data && !success && process.env.DEBUG === 'true') {
    console.log(`   Response Data:`, JSON.stringify(data, null, 2));
  }
  console.log('');
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

// Test Admin Login directly
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

// FIXED: Registration with proper error handling
const testUserRegistration = async () => {
  try {
    const response = await api.post('/api/auth/register', testUser);
    
    // Check response structure
    if (response.data.success && response.data.data) {
      authToken = response.data.data.tokens?.accessToken || response.data.data.token;
      userId = response.data.data.user?._id || response.data.data._id;
      
      if (authToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
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

const testUserLogin = async () => {
  try {
    const response = await api.post('/api/auth/login', testLogin);
    
    if (response.data.success && response.data.data) {
      authToken = response.data.data.tokens?.accessToken || response.data.data.token;
      userId = response.data.data.user?._id || response.data.data._id;
      
      if (authToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
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

// ACCOUNT TESTS - Check which endpoints actually exist
const testGetAccountBalance = async () => {
  try {
    const response = await api.get('/api/account/balance');
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
    const response = await api.get('/api/account/details');
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

// PROFILE TESTS
const testGetProfile = async () => {
  try {
    const response = await api.get('/api/auth/profile');
    const username = response.data.data?.user?.username || response.data.data?.username || 'N/A';
    printResult('Get Profile', true, `Profile for: ${username}`);
    return true;
  } catch (error) {
    printResult('Get Profile', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

// BLOG TESTS - Public Endpoints
const testGetPublicBlogs = async () => {
  try {
    const response = await api.get('/api/blogs');
    
    // Handle different response structures
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
    
    // Check response structure
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

// BLOG TESTS - Admin Endpoints
const testCreateBlogPost = async () => {
  try {
    const adminApi = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const response = await adminApi.post('/api/blogs', testBlogPost);
    
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

// BLOG TESTS - User Interactions
const testLikeBlog = async () => {
  try {
    if (!blogId) {
      printResult('Like Blog', false, 'No blog ID available');
      return false;
    }
    
    const response = await api.put(`/api/blogs/${blogId}/like`);
    if (response.data.success) {
      const isLiked = response.data.data?.isLiked || false;
      const likesCount = response.data.data?.likesCount || 0;
      printResult('Like Blog', true, `Liked: ${isLiked}, Likes: ${likesCount}`);
      return true;
    } else {
      printResult('Like Blog', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Like Blog', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

const testBookmarkBlog = async () => {
  try {
    if (!blogId) {
      printResult('Bookmark Blog', false, 'No blog ID available');
      return false;
    }
    
    const response = await api.put(`/api/blogs/${blogId}/bookmark`);
    if (response.data.success) {
      const isBookmarked = response.data.data?.isBookmarked || false;
      printResult('Bookmark Blog', true, `Bookmarked: ${isBookmarked}`);
      return true;
    } else {
      printResult('Bookmark Blog', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Bookmark Blog', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

const testAddComment = async () => {
  try {
    if (!blogId) {
      printResult('Add Comment', false, 'No blog ID available');
      return false;
    }
    
    const response = await api.post(`/api/blogs/${blogId}/comments`, testComment);
    if (response.data.success) {
      commentId = response.data.data?._id || response.data.data?.comment?._id;
      printResult('Add Comment', true, 'Comment added successfully');
      return true;
    } else {
      printResult('Add Comment', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Add Comment', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

// LOAN TESTS
const testCreateLoanApplication = async () => {
  try {
    const response = await api.post('/api/loans/applications', testLoanApplication);
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
    const response = await api.get('/api/loans/applications');
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

// CONTACT TESTS
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
      // Check if already subscribed
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

// Test upload endpoint
const testImageUpload = async () => {
  try {
    const adminApi = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    // Skip if admin token not available
    if (!adminToken) {
      printResult('Image Upload', false, 'Admin token not available');
      return false;
    }

    // Create a test image file
    const testImagePath = path.join(process.cwd(), 'test-image.jpg');
    
    // Skip if test image doesn't exist
    if (!fs.existsSync(testImagePath)) {
      printResult('Image Upload', false, 'Test image file not found. Create a test-image.jpg file first.');
      return false;
    }

    const formData = new FormData();
    const imageBuffer = fs.readFileSync(testImagePath);
    
    // In Node.js, we need to use a different approach for FormData
    // We'll use the 'form-data' package or skip for now
    printResult('Image Upload', false, 'Image upload requires FormData implementation in Node.js');
    return false;

  } catch (error) {
    printResult('Image Upload', false, error.response?.data?.message || error.message, error, error.response?.data);
    return false;
  }
};

// Test admin dashboard endpoints
const testAdminDashboard = async () => {
  try {
    const adminApi = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const response = await adminApi.get('/api/admin/dashboard');
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

// Main test runner - SIMPLIFIED
const runAllTests = async () => {
  console.log('🚀 Starting Emerald Capital Backend Endpoint Tests\n');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Basic connectivity
    console.log('\n🔗 Testing Basic Connectivity...\n');
    await testHealthCheck();
    await delay(500);
    
    // Step 2: Admin login (using seed credentials)
    console.log('\n👑 Testing Admin Login...\n');
    const adminLoggedIn = await testAdminLoginEndpoint();
    await delay(500);
    
    // Step 3: User registration/login
    console.log('\n👤 Testing User Authentication...\n');
    await testUserRegistration();
    await delay(500);
    
    // Step 4: Profile test
    console.log('\n📋 Testing Profile Endpoints...\n');
    await testGetProfile();
    await delay(500);
    
    // Step 5: Account tests
    console.log('\n💰 Testing Account Endpoints...\n');
    await testGetAccountBalance();
    await delay(300);
    await testGetAccountDetails();
    await delay(300);
    
    // Step 6: Loan tests
    console.log('\n🏦 Testing Loan Endpoints...\n');
    await testCreateLoanApplication();
    await delay(500);
    await testGetMyLoanApplications();
    await delay(500);
    
    // Step 7: Contact tests
    console.log('\n📧 Testing Contact Endpoints...\n');
    await testSubmitContactMessage();
    await delay(500);
    await testNewsletterSubscription();
    await delay(500);
    
    // Step 8: Blog public tests
    console.log('\n📝 Testing Public Blog Endpoints...\n');
    await testGetPublicBlogs();
    await delay(500);
    await testGetPopularBlogs();
    await delay(500);
    await testGetSingleBlog();
    await delay(500);
    
    // Step 9: Admin blog tests (only if admin is logged in)
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
      
      // User interaction tests with the new blog
      if (blogId) {
        console.log('\n❤️  Testing User Interactions with Blog...\n');
        await testLikeBlog();
        await delay(300);
        await testBookmarkBlog();
        await delay(300);
        await testAddComment();
        await delay(300);
      }
    } else {
      console.log('\n⚠️  Skipping admin tests - admin login failed');
      console.log('   Using seed credentials: username="adminuser", password="admin123"');
    }
    
    console.log('='.repeat(60));
    console.log('\n🎉 All tests completed!');
    console.log('\n📊 Summary:');
    console.log(`   • Admin Token: ${adminToken ? '✅ Obtained' : '❌ Failed'}`);
    console.log(`   • User Token: ${authToken ? '✅ Obtained' : '❌ Failed'}`);
    console.log(`   • Blog Created: ${blogId ? '✅ Yes' : '❌ No'}`);
    
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