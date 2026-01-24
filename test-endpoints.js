// test-endpoints-fixed.js
import axios from 'axios';
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
let blogId = '';
let blogSlug = '';
let commentId = '';

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
  agreementConfirmed: true // REQUIRED FIELD
};

// FIXED: Admin user data - REMOVED role field for registration
const testAdminUser = {
  sex: 'male',
  firstName: 'Admin',
  lastName: 'User',
  middleName: 'System',
  dateOfBirth: '1985-01-01',
  phone: '0241111111',
  otherPhone: '0242222222',
  ghanaCardNumber: 'GHA-987654321-B',
  email: 'admin@test.com',
  homeAddress: '456 Admin Street, Accra, Ghana',
  region: 'Greater Accra',
  nextOfKin: [
    {
      relationship: 'parent',
      firstName: 'System',
      lastName: 'Admin'
    }
  ],
  nextOfKinPhone: '0243333333',
  employmentType: ['private'],
  employer: 'Emerald Capital Ltd',
  staffNumber: 'ADM001',
  employmentDate: '2015-01-01',
  gradeLevel: 'Director',
  lastMonthPay: 10000,
  username: 'adminuser',
  password: 'admin123',
  agreementConfirmed: true // REQUIRED FIELD
  // REMOVED: role: 'admin' - Will be set to 'user' by default
};

const testLogin = {
  username: 'johndoe',
  password: 'password123'
};

const testAdminLogin = {
  username: 'adminuser',
  password: 'admin123'
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

const printResult = (testName, success, message = '', data = null) => {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${testName}`);
  if (message) console.log(`   Message: ${message}`);
  if (data && !success && process.env.DEBUG === 'true') {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
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

// FIXED: Registration with proper error handling
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
    const errorMessage = error.response?.data?.message || error.message;
    if (error.response?.status === 400 && errorMessage.includes('already exists')) {
      printResult('User Registration', true, 'User already exists, trying login...');
      return await testUserLogin();
    }
    printResult('User Registration', false, errorMessage);
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

// FIXED: Admin user creation without role field
const testCreateAdminUser = async () => {
  try {
    // Try to create admin user (without role field)
    const response = await api.post('/auth/register', testAdminUser);
    const userToken = response.data.data.tokens.accessToken;
    const createdUserId = response.data.data.user._id;
    
    // Create axios instance for the new user
    const userApi = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    printResult('Create User for Admin Testing', true, 'User created (will need manual role update)');
    console.log('   Note: Role will need to be updated manually to "admin" in database');
    console.log(`   User ID for manual update: ${createdUserId}`);
    
    return { adminApi: userApi, adminToken: userToken };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    if (error.response?.status === 400 && errorMessage.includes('already exists')) {
      // User exists, try to login
      try {
        const response = await api.post('/auth/login', testAdminLogin);
        const adminToken = response.data.data.tokens.accessToken;
        
        const adminApi = axios.create({
          baseURL: API_BASE_URL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        printResult('Admin Login', true, 'Admin user logged in successfully');
        return { adminApi, adminToken };
      } catch (loginError) {
        printResult('Admin Login', false, loginError.response?.data?.message || loginError.message);
        return null;
      }
    }
    printResult('Create Admin User', false, errorMessage);
    return null;
  }
};

// NEW: Function to manually update user to admin via MongoDB command suggestion
const suggestAdminUpdate = async (username) => {
  console.log('\n🔧 To make this user an admin, run this MongoDB command:');
  console.log(`db.users.updateOne({username: "${username}"}, {$set: {role: "admin"}})`);
  console.log('Or use MongoDB Compass to manually update the role field.');
};

// ACCOUNT TESTS
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

// PROFILE TESTS
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

// BLOG TESTS - Public Endpoints
const testGetPublicBlogs = async () => {
  try {
    const response = await api.get('/blogs');
    printResult('Get Public Blogs', true, `Found ${response.data.data.length} blogs`);
    return true;
  } catch (error) {
    printResult('Get Public Blogs', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetPopularBlogs = async () => {
  try {
    const response = await api.get('/blogs/popular?limit=3');
    
    // Debug: log the response structure
    console.log('Popular blogs response:', JSON.stringify(response.data, null, 2));
    
    // Check response structure
    if (response.data && response.data.success) {
      const blogs = response.data.data || [];
      const blogCount = Array.isArray(blogs) ? blogs.length : 0;
      printResult('Get Popular Blogs', true, `Found ${blogCount} popular blogs`);
      return true;
    } else {
      printResult('Get Popular Blogs', false, 'Invalid response format from server');
      return false;
    }
  } catch (error) {
    // Log detailed error information
    console.error('Popular blogs error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    printResult('Get Popular Blogs', false, error.response?.data?.message || error.message);
    return false;
  }
};
// BLOG TESTS - Admin Endpoints
const testCreateBlogPost = async (adminApi) => {
  try {
    const response = await adminApi.post('/blogs', testBlogPost);
    blogId = response.data.data._id;
    blogSlug = response.data.data.slug;
    printResult('Create Blog Post', true, `Blog created with ID: ${blogId}`);
    return true;
  } catch (error) {
    printResult('Create Blog Post', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetSingleBlog = async () => {
  try {
    if (!blogSlug) {
      // Try to get any existing blog
      const blogsResponse = await api.get('/blogs?limit=1');
      if (blogsResponse.data.data.length > 0) {
        blogSlug = blogsResponse.data.data[0].slug;
      } else {
        printResult('Get Single Blog', false, 'No blogs available');
        return false;
      }
    }
    
    const response = await api.get(`/blogs/${blogSlug}`);
    printResult('Get Single Blog', true, `Blog retrieved: ${response.data.data.title}`);
    return true;
  } catch (error) {
    printResult('Get Single Blog', false, error.response?.data?.message || error.message);
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
    const response = await api.put(`/blogs/${blogId}/like`);
    printResult('Like Blog', true, `Liked: ${response.data.isLiked}, Likes: ${response.data.likesCount}`);
    return true;
  } catch (error) {
    printResult('Like Blog', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testBookmarkBlog = async () => {
  try {
    if (!blogId) {
      printResult('Bookmark Blog', false, 'No blog ID available');
      return false;
    }
    const response = await api.put(`/blogs/${blogId}/bookmark`);
    printResult('Bookmark Blog', true, `Bookmarked: ${response.data.isBookmarked}`);
    return true;
  } catch (error) {
    printResult('Bookmark Blog', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testAddComment = async () => {
  try {
    if (!blogId) {
      printResult('Add Comment', false, 'No blog ID available');
      return false;
    }
    const response = await api.post(`/blogs/${blogId}/comments`, testComment);
    commentId = response.data.data.comments[0]._id;
    printResult('Add Comment', true, 'Comment added successfully');
    return true;
  } catch (error) {
    printResult('Add Comment', false, error.response?.data?.message || error.message);
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

// CONTACT TESTS
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

// Main test runner - SIMPLIFIED
const runAllTests = async () => {
  console.log('🚀 Starting Emerald Capital Backend Endpoint Tests\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Basic connectivity
    await testHealthCheck();
    await delay(300);
    
    // Step 2: User registration/login
    console.log('\n👤 Testing User Authentication...\n');
    await testUserRegistration();
    await delay(300);
    
    // Step 3: Account tests
    console.log('\n💰 Testing Account Endpoints...\n');
    await testGetAccountBalance();
    await delay(300);
    await testGetAccountDetails();
    await delay(300);
    await testGetTransactions();
    await delay(300);
    
    // Step 4: Profile test
    await testGetProfile();
    await delay(300);
    
    // Step 5: Loan tests
    console.log('\n🏦 Testing Loan Endpoints...\n');
    await testCreateLoanApplication();
    await delay(300);
    await testGetMyLoanApplications();
    await delay(300);
    
    // Step 6: Contact tests
    console.log('\n📧 Testing Contact Endpoints...\n');
    await testSubmitContactMessage();
    await delay(300);
    await testNewsletterSubscription();
    await delay(300);
    
    // Step 7: Blog public tests
    console.log('\n📝 Testing Public Blog Endpoints...\n');
    await testGetPublicBlogs();
    await delay(300);
    await testGetPopularBlogs();
    await delay(300);
    await testGetSingleBlog();
    await delay(300);
    
    // Step 8: Admin setup for blog creation
    console.log('\n👨‍💼 Setting up for admin tests...\n');
    const admin = await testCreateAdminUser();
    if (admin) {
      console.log('\n📝 Testing Admin Blog Creation...\n');
      await testCreateBlogPost(admin.adminApi);
      await delay(500);
      
      // User interaction tests with the new blog
      console.log('\n❤️  Testing User Interactions with Blog...\n');
      await testLikeBlog();
      await delay(300);
      await testBookmarkBlog();
      await delay(300);
      await testAddComment();
      await delay(300);
    } else {
      console.log('\n⚠️  Skipping admin blog tests - need admin access');
      await suggestAdminUpdate('adminuser');
    }
    
    console.log('='.repeat(60));
    console.log('\n🎉 Core tests completed!');
    console.log('\n💡 Note: Admin tests require manual role update in database.');
    console.log('   Run the MongoDB command shown above to enable admin features.');
    
  } catch (error) {
    console.error('\n❌ Test runner error:', error.message);
  }
};

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});