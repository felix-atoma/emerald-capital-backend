// test-endpoints-comprehensive.js
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

// State variables
let authToken = '';
let userId = '';
let loanApplicationId = '';
let contactMessageId = '';
let recipientAccountNumber = '';
let blogId = '';
let blogSlug = '';
let commentId = '';
let adminToken = '';
let officerToken = '';
let uploadedImageUrl = '';
let uploadedImagePublicId = '';

// ==================== COMPREHENSIVE TEST DATA ====================

// All seeded user credentials
const seededUsers = {
  admin: {
    username: 'EmeraldAdmin',
    password: 'Emerald@Admin1&$',
    email: 'admin@emerald.com',
    role: 'admin',
    firstName: 'Emerald',
    lastName: 'Admin'
  },
  officer: {
    username: 'sarah.officer',
    password: 'Officer@123',
    email: 'officer@emerald.com',
    role: 'officer',
    firstName: 'Sarah',
    lastName: 'Officer'
  },
  regular: {
    username: 'johndoe',
    password: 'password123',
    email: 'john.doe@test.com',
    role: 'user',
    firstName: 'John',
    lastName: 'Doe'
  }
};

// User registration data - renamed to avoid conflict
const newUserRegistrationData = {
  sex: 'female',
  firstName: 'Alice',
  lastName: 'Smith',
  middleName: 'Marie',
  dateOfBirth: '1992-03-15',
  phone: '0241112222',
  otherPhone: '0243334444',
  ghanaCardNumber: 'GHA-888888888-X',
  email: 'alice.smith@test.com',
  homeAddress: '456 New Street, Kumasi, Ghana',
  region: 'Ashanti',
  nextOfKin: [
    {
      relationship: 'parent',
      firstName: 'Robert',
      lastName: 'Smith'
    }
  ],
  nextOfKinPhone: '0245556666',
  employmentType: ['education'],
  employer: 'University of Ghana',
  staffNumber: 'UNIV001',
  employmentDate: '2019-06-01',
  gradeLevel: 'Lecturer',
  lastMonthPay: 7500,
  username: 'alicesmith',
  password: 'Password123!',
  agreementConfirmed: true
};

// Test user update data
const testUserUpdate = {
  phone: '0249998888',
  otherPhone: '0247776666',
  homeAddress: '789 Updated Street, Accra, Ghana',
  region: 'Greater Accra'
};

// Loan application test data
const loanApplications = {
  personal: {
    tenor: 12,
    loanAmountRequested: 15000,
    loanPurpose: 'education',
    purposeDescription: 'Funding for professional certification courses',
    agreementConfirmed: true
  },
  business: {
    tenor: 24,
    loanAmountRequested: 50000,
    loanPurpose: 'business',
    purposeDescription: 'Expanding retail business operations',
    agreementConfirmed: true
  },
  emergency: {
    tenor: 6,
    loanAmountRequested: 5000,
    loanPurpose: 'medical',
    purposeDescription: 'Emergency medical expenses',
    agreementConfirmed: true
  }
};

// Contact messages test data
const contactMessages = [
  {
    name: 'Kwame Mensah',
    email: 'kwame.mensah@example.com',
    phone: '0241234567',
    website: 'https://kwamebusiness.com',
    message: 'I am interested in your business loan products. Can you send me more information about the requirements and interest rates?',
    agreedToTerms: true
  },
  {
    name: 'Ama Adjei',
    email: 'ama.adjei@example.com',
    phone: '0247654321',
    message: 'I need assistance with my loan application. The online form is not submitting properly.',
    agreedToTerms: true
  },
  {
    name: 'Kofi Boateng',
    email: 'kofi.boateng@example.com',
    phone: '0249876543',
    website: 'https://boatengenterprises.com',
    message: 'I would like to schedule a meeting to discuss investment opportunities with Emerald Capital.',
    agreedToTerms: true
  }
];

// Newsletter subscriptions test data
const newsletterSubscriptions = [
  { email: 'subscriber1@example.com' },
  { email: 'subscriber2@example.com' },
  { email: 'subscriber3@example.com' },
  { email: 'test.duplicate@example.com' }
];

// Blog posts test data
const blogPosts = [
  {
    title: 'The Future of Digital Banking in Ghana',
    excerpt: 'Explore how digital transformation is reshaping the banking landscape in Ghana and what it means for consumers and businesses.',
    content: `
      <h1>The Digital Banking Revolution in Ghana</h1>
      <p>Ghana's banking sector is undergoing a significant digital transformation. With increasing smartphone penetration and improved internet connectivity, more Ghanaians are embracing digital banking solutions.</p>
      
      <h2>Key Trends</h2>
      <ul>
        <li>Mobile money integration with traditional banking</li>
        <li>AI-powered customer service chatbots</li>
        <li>Blockchain for secure transactions</li>
        <li>Contactless payment solutions</li>
      </ul>
      
      <h2>Benefits for Consumers</h2>
      <p>Digital banking offers convenience, accessibility, and often lower transaction costs. Customers can now perform banking activities 24/7 from their mobile devices.</p>
      
      <h2>Emerald Capital's Digital Strategy</h2>
      <p>We're investing heavily in digital infrastructure to provide seamless banking experiences while maintaining the highest security standards.</p>
    `,
    category: 'Digital Banking',
    author: 'Emerald Admin',
    readTime: 8,
    tags: ['digital banking', 'fintech', 'ghana', 'mobile money', 'innovation'],
    isFeatured: true,
    isPublished: true,
    metaTitle: 'Digital Banking Future in Ghana | Emerald Capital',
    metaDescription: 'Discover how digital transformation is changing banking in Ghana and what it means for you.'
  },
  {
    title: 'Investment Strategies for Young Professionals',
    excerpt: 'Practical investment advice for young professionals starting their financial journey in Ghana.',
    content: `
      <h1>Building Wealth Early: A Guide for Young Professionals</h1>
      <p>Starting your investment journey early can significantly impact your long-term financial security. Here's a comprehensive guide for young professionals in Ghana.</p>
      
      <h2>Start With These Basics</h2>
      <ol>
        <li><strong>Emergency Fund:</strong> Save 3-6 months of expenses</li>
        <li><strong>Clear High-Interest Debt:</strong> Pay off credit cards and high-interest loans first</li>
        <li><strong>Retirement Planning:</strong> Start contributing to SSNIT or private pension plans</li>
      </ol>
      
      <h2>Investment Options in Ghana</h2>
      <h3>1. Treasury Bills</h3>
      <p>Low-risk, government-backed securities with competitive returns.</p>
      
      <h3>2. Mutual Funds</h3>
      <p>Professional management of diversified portfolios.</p>
      
      <h3>3. Stock Market (GSE)</h3>
      <p>Invest in leading Ghanaian companies through the Ghana Stock Exchange.</p>
      
      <h3>4. Real Estate</h3>
      <p>Long-term appreciation potential, but requires significant capital.</p>
      
      <h2>Emerald Capital's Youth Investment Program</h2>
      <p>We offer specialized investment products with lower minimum deposits for young professionals starting their investment journey.</p>
    `,
    category: 'Investments',
    author: 'Sarah Officer',
    readTime: 12,
    tags: ['investing', 'young professionals', 'wealth building', 'financial planning'],
    isFeatured: true,
    isPublished: true,
    metaTitle: 'Investment Guide for Young Ghanaian Professionals',
    metaDescription: 'Learn how to start building wealth with smart investment strategies tailored for young professionals.'
  },
  {
    title: 'Understanding Agricultural Loans in Ghana',
    excerpt: 'A comprehensive guide to agricultural financing options available to Ghanaian farmers and agribusinesses.',
    content: `
      <h1>Financing Agriculture in Ghana</h1>
      <p>Agriculture remains a crucial sector of Ghana's economy, and access to financing is essential for growth and modernization.</p>
      
      <h2>Types of Agricultural Loans</h2>
      <h3>1. Seasonal Loans</h3>
      <p>Short-term financing for planting seasons, typically repaid after harvest.</p>
      
      <h3>2. Equipment Financing</h3>
      <p>Loans for purchasing farming equipment and machinery.</p>
      
      <h3>3. Agribusiness Expansion</h3>
      <p>Medium to long-term loans for expanding agricultural operations.</p>
      
      <h2>Eligibility Requirements</h2>
      <ul>
        <li>Valid Ghana Card</li>
        <li>Proof of land ownership or lease agreement</li>
        <li>Business plan for the agricultural project</li>
        <li>Minimum 2 years farming experience</li>
      </ul>
      
      <h2>Government Support Programs</h2>
      <p>Several government initiatives, including Planting for Food and Jobs, offer support and sometimes subsidized financing for farmers.</p>
      
      <h2>Emerald Capital's Agri-Loan Products</h2>
      <p>We offer specialized agricultural loans with flexible repayment terms aligned with farming cycles and competitive interest rates.</p>
    `,
    category: 'Agricultural Finance',
    author: 'Emerald Admin',
    readTime: 10,
    tags: ['agriculture', 'farming', 'agribusiness', 'loans', 'ghana'],
    isFeatured: false,
    isPublished: true,
    metaTitle: 'Agricultural Loans Guide | Emerald Capital Ghana',
    metaDescription: 'Complete guide to agricultural financing options for Ghanaian farmers and agribusiness owners.'
  }
];

// Blog comments test data
const blogComments = [
  { text: 'This is very insightful! I learned a lot about digital banking trends.' },
  { text: 'Could you write more about mobile money security measures?' },
  { text: 'Great article! When will Emerald Capital launch its mobile app?' },
  { text: 'I appreciate the practical advice for young investors.' },
  { text: 'As a farmer, I found the agricultural loans guide very helpful.' }
];

// Transaction test data
const transactions = [
  {
    amount: 1000,
    type: 'deposit',
    description: 'Initial account funding'
  },
  {
    amount: 500,
    type: 'withdrawal',
    description: 'Emergency cash withdrawal'
  },
  {
    amount: 2500,
    type: 'transfer',
    description: 'Payment to supplier',
    recipientAccountNumber: 'ACC789012'
  }
];

// Account data
const accountData = {
  create: {
    accountType: 'savings',
    initialDeposit: 1000
  },
  update: {
    preferredName: 'Primary Savings'
  }
};

// Image paths for testing
const testImages = {
  blog: path.join(process.cwd(), 'test-blog-image.jpg'),
  profile: path.join(process.cwd(), 'test-profile-image.jpg'),
  logo: path.join(process.cwd(), 'test-logo.png')
};

// ==================== UTILITY FUNCTIONS ====================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const printResult = (testName, success, message = '', error = null, data = null) => {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${testName}`);
  if (message) console.log(`   Message: ${message}`);
  if (error && !success) {
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.error && process.env.DEBUG === 'true') {
      console.log(`   Details: ${error.response.data.error}`);
    }
  }
  if (data && process.env.DEBUG === 'true') {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
  console.log('');
};

const printSection = (title) => {
  console.log('\n' + '='.repeat(60));
  console.log(`📋 ${title}`);
  console.log('='.repeat(60));
};

const createAuthApi = (token) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

const createTestImage = (filePath, type = 'blog') => {
  if (!fs.existsSync(filePath)) {
    console.log(`   Creating test ${type} image file...`);
    
    // Different image sizes for different purposes
    const imageSizes = {
      blog: { width: 800, height: 400 },
      profile: { width: 200, height: 200 },
      logo: { width: 400, height: 400 }
    };
    
    const size = imageSizes[type] || imageSizes.blog;
    
    // Create a simple colored rectangle as test image
    const tinyJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 
      (size.height >> 8) & 0xFF, size.height & 0xFF,
      (size.width >> 8) & 0xFF, size.width & 0xFF,
      0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05,
      0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5,
      0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05,
      0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03,
      0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13,
      0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1,
      0x08, 0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24,
      0x33, 0x62, 0x72, 0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19,
      0x1A, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35, 0x36,
      0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
      0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A,
      0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74,
      0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86,
      0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97,
      0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7, 0xA8,
      0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9,
      0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA,
      0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1,
      0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1,
      0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF,
      0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x3F, 0x00
    ]);
    
    fs.writeFileSync(filePath, tinyJpeg);
    console.log(`   ✅ Test ${type} image file created (${size.width}x${size.height} pixels)`);
  }
  return true;
};

// ==================== TEST FUNCTIONS ====================

// Basic connectivity tests
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
    printResult('CORS Debug', true, `Origin: ${response.data.requestOrigin || 'None'}`);
    return true;
  } catch (error) {
    printResult('CORS Debug', false, error.message, error);
    return false;
  }
};

const testUploadsCheck = async () => {
  try {
    const response = await api.get('/api/uploads-check');
    const blogImages = response.data.blogImages;
    const fileExists = blogImages?.targetFile?.exists || false;
    const fileCount = blogImages?.files?.length || 0;
    
    printResult('Uploads Check', true, 
      `Blog images: ${fileCount} files, Target exists: ${fileExists}`);
    return true;
  } catch (error) {
    printResult('Uploads Check', false, error.message, error);
    return false;
  }
};

const testCloudinaryConfig = async () => {
  try {
    const response = await api.get('/api/upload/config');
    const cloudinaryConfigured = response.data.data?.cloudinary?.configured || false;
    const cloudName = response.data.data?.cloudinary?.cloud_name || 'Not configured';
    
    printResult('Cloudinary Config', true, 
      `Cloudinary: ${cloudinaryConfigured ? '✅ Configured' : '❌ Not configured'}, Cloud: ${cloudName}`);
    return cloudinaryConfigured;
  } catch (error) {
    printResult('Cloudinary Config', false, error.message, error);
    return false;
  }
};

// Authentication tests
const testLogin = async (userType) => {
  const user = seededUsers[userType];
  try {
    console.log(`   📤 Attempting ${userType} login with: ${user.username}`);
    
    const response = await api.post('/api/auth/login', {
      username: user.username,
      password: user.password
    });
    
    const token = response.data.data?.tokens?.access || response.data.token;
    
    if (token) {
      printResult(`${userType.charAt(0).toUpperCase() + userType.slice(1)} Login`, 
        true, `${user.firstName} ${user.lastName} logged in successfully`);
      return { token, userData: response.data.data?.user || response.data.data };
    } else {
      printResult(`${userType.charAt(0).toUpperCase() + userType.slice(1)} Login`, 
        false, 'No token received', null, response.data);
      return null;
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    printResult(`${userType.charAt(0).toUpperCase() + userType.slice(1)} Login`, 
      false, errorMessage, error, error.response?.data);
    return null;
  }
};

const testAdminLogin = async () => {
  const result = await testLogin('admin');
  if (result) {
    adminToken = result.token;
    return true;
  }
  return false;
};

const testOfficerLogin = async () => {
  const result = await testLogin('officer');
  if (result) {
    officerToken = result.token;
    return true;
  }
  return false;
};

const testRegularUserLogin = async () => {
  const result = await testLogin('regular');
  if (result) {
    authToken = result.token;
    userId = result.userData?._id;
    return true;
  }
  return false;
};

// Renamed this function to avoid conflict with the data variable
const testNewUserRegistration = async () => {
  try {
    const response = await api.post('/api/auth/register', newUserRegistrationData);
    
    if (response.data.success && response.data.data) {
      authToken = response.data.data.tokens?.access || response.data.data.token;
      userId = response.data.data.user?._id || response.data.data._id;
      
      if (authToken) {
        printResult('New User Registration', true, 
          `${newUserRegistrationData.firstName} ${newUserRegistrationData.lastName} registered successfully`);
        return true;
      }
    }
    
    printResult('New User Registration', false, 'Invalid response structure', null, response.data);
    return false;
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    if (error.response?.status === 400 && errorMessage.includes('already exists')) {
      printResult('New User Registration', true, 'User already exists, using existing credentials');
      return await testRegularUserLogin();
    }
    printResult('New User Registration', false, errorMessage, error, error.response?.data);
    return false;
  }
};

// User profile tests
const testGetProfile = async () => {
  try {
    if (!authToken) {
      printResult('Get Profile', false, 'No user token available');
      return false;
    }
    
    const authApi = createAuthApi(authToken);
    const response = await authApi.get('/api/auth/profile');
    const user = response.data.data?.user || response.data.data;
    const username = user?.username || 'N/A';
    const email = user?.email || 'N/A';
    
    printResult('Get Profile', true, `Profile retrieved for: ${username} (${email})`);
    return true;
  } catch (error) {
    printResult('Get Profile', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

const testUpdateProfile = async () => {
  try {
    if (!authToken) {
      printResult('Update Profile', false, 'No user token available');
      return false;
    }
    
    const authApi = createAuthApi(authToken);
    const response = await authApi.put('/api/auth/profile', testUserUpdate);
    
    if (response.data.success) {
      printResult('Update Profile', true, 'Profile updated successfully');
      return true;
    } else {
      printResult('Update Profile', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Update Profile', false, error.response?.data?.message || error.message, error);
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
    const account = response.data.data?.account || response.data.data;
    const accountNumber = account?.accountNumber || 'N/A';
    recipientAccountNumber = accountNumber;
    
    printResult('Get Account Details', true, `Account: ${accountNumber}, Type: ${account?.accountType || 'N/A'}`);
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

const testGetTransactionHistory = async () => {
  try {
    if (!authToken) {
      printResult('Get Transaction History', false, 'No user token available');
      return false;
    }
    
    const authApi = createAuthApi(authToken);
    const response = await authApi.get('/api/account/transactions');
    
    if (response.data.success) {
      const transactions = response.data.data?.transactions || response.data.data || [];
      const count = Array.isArray(transactions) ? transactions.length : 0;
      printResult('Get Transaction History', true, `Found ${count} transactions`);
      return true;
    } else {
      printResult('Get Transaction History', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      printResult('Get Transaction History', false, 'Endpoint not found (might be disabled)', error);
    } else {
      printResult('Get Transaction History', false, error.response?.data?.message || error.message, error);
    }
    return false;
  }
};

// Loan tests
const testCreateLoanApplication = async (loanType) => {
  const loanData = loanApplications[loanType];
  try {
    if (!authToken) {
      printResult(`Create ${loanType} Loan Application`, false, 'No user token available');
      return false;
    }
    
    const authApi = createAuthApi(authToken);
    const response = await authApi.post('/api/loans/applications', loanData);
    
    if (response.data.success) {
      loanApplicationId = response.data.data?._id || response.data.data?.loanApplication?._id;
      printResult(`Create ${loanType} Loan Application`, true, 
        `${loanType.charAt(0).toUpperCase() + loanType.slice(1)} loan application created (GHS ${loanData.loanAmountRequested})`);
      return true;
    } else {
      printResult(`Create ${loanType} Loan Application`, false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult(`Create ${loanType} Loan Application`, false, error.response?.data?.message || error.message, error);
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
const testSubmitContactMessage = async (messageIndex) => {
  const message = contactMessages[messageIndex];
  try {
    const response = await api.post('/api/contact', message);
    
    if (response.data.success) {
      contactMessageId = response.data.data?._id || response.data.data?.message?._id;
      printResult(`Submit Contact Message ${messageIndex + 1}`, true, 
        `Message from ${message.name} submitted successfully`);
      return true;
    } else {
      printResult(`Submit Contact Message ${messageIndex + 1}`, false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult(`Submit Contact Message ${messageIndex + 1}`, false, error.response?.data?.message || error.message, error);
    return false;
  }
};

const testNewsletterSubscription = async (subscriptionIndex) => {
  const subscription = newsletterSubscriptions[subscriptionIndex];
  try {
    const response = await api.post('/api/newsletter/subscribe', subscription);
    
    if (response.data.success) {
      printResult(`Newsletter Subscription ${subscriptionIndex + 1}`, true, 
        `${subscription.email} subscribed successfully`);
      return true;
    } else {
      if (response.data.message?.includes('already subscribed') || response.data.message?.includes('already exists')) {
        printResult(`Newsletter Subscription ${subscriptionIndex + 1}`, true, 
          `${subscription.email} already subscribed (expected)`);
        return true;
      }
      printResult(`Newsletter Subscription ${subscriptionIndex + 1}`, false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already subscribed')) {
      printResult(`Newsletter Subscription ${subscriptionIndex + 1}`, true, 
        `${subscription.email} already subscribed (expected)`);
      return true;
    }
    printResult(`Newsletter Subscription ${subscriptionIndex + 1}`, false, error.response?.data?.message || error.message, error);
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

const testGetSingleBlog = async () => {
  try {
    const blogsResponse = await api.get('/api/blogs?limit=1');
    
    let testBlogSlug = null;
    if (blogsResponse.data.success) {
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
    const blog = response.data.data?.blog || response.data.data;
    const title = blog?.title || 'Unknown';
    const views = blog?.views || 0;
    
    printResult('Get Single Blog', true, `Blog retrieved: "${title}" (${views} views)`);
    return true;
  } catch (error) {
    printResult('Get Single Blog', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

const testCreateBlogPost = async (postIndex) => {
  const postData = blogPosts[postIndex];
  try {
    if (!adminToken) {
      printResult(`Create Blog Post ${postIndex + 1}`, false, 'No admin token available');
      return false;
    }
    
    const authApi = createAuthApi(adminToken);
    const response = await authApi.post('/api/blogs', postData, {
      timeout: 15000
    });
    
    if (response.data.success) {
      blogId = response.data.data?._id || response.data.data?.blog?._id;
      blogSlug = response.data.data?.slug || response.data.data?.blog?.slug;
      
      printResult(`Create Blog Post ${postIndex + 1}`, true, 
        `Blog created: "${postData.title}"`);
      return true;
    } else {
      printResult(`Create Blog Post ${postIndex + 1}`, false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      printResult(`Create Blog Post ${postIndex + 1}`, false, 'Request timeout - server took too long to respond', error);
    } else {
      printResult(`Create Blog Post ${postIndex + 1}`, false, error.response?.data?.message || error.message, error, error.response?.data);
    }
    return false;
  }
};

const testAddBlogComment = async (commentIndex) => {
  const comment = blogComments[commentIndex];
  try {
    if (!authToken) {
      printResult(`Add Blog Comment ${commentIndex + 1}`, false, 'No user token available');
      return false;
    }
    
    const blogsResponse = await api.get('/api/blogs?limit=1');
    if (!blogsResponse.data.success || !blogsResponse.data.data) {
      printResult(`Add Blog Comment ${commentIndex + 1}`, false, 'No blogs available');
      return false;
    }
    
    const blogs = blogsResponse.data.data?.blogs || blogsResponse.data.data || [];
    if (blogs.length === 0) {
      printResult(`Add Blog Comment ${commentIndex + 1}`, false, 'No blogs found');
      return false;
    }
    
    const blogId = blogs[0]._id;
    const authApi = createAuthApi(authToken);
    const response = await authApi.post(`/api/blogs/${blogId}/comments`, comment);
    
    if (response.data.success) {
      commentId = response.data.data?._id || response.data.data?.comment?._id;
      printResult(`Add Blog Comment ${commentIndex + 1}`, true, 'Comment added successfully');
      return true;
    } else {
      printResult(`Add Blog Comment ${commentIndex + 1}`, false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult(`Add Blog Comment ${commentIndex + 1}`, false, error.response?.data?.message || error.message, error);
    return false;
  }
};

const testToggleBlogLike = async () => {
  try {
    if (!authToken) {
      printResult('Toggle Blog Like', false, 'No user token available');
      return false;
    }
    
    const blogsResponse = await api.get('/api/blogs?limit=1');
    if (!blogsResponse.data.success || !blogsResponse.data.data) {
      printResult('Toggle Blog Like', false, 'No blogs available');
      return false;
    }
    
    const blogs = blogsResponse.data.data?.blogs || blogsResponse.data.data || [];
    if (blogs.length === 0) {
      printResult('Toggle Blog Like', false, 'No blogs found');
      return false;
    }
    
    const blogId = blogs[0]._id;
    const authApi = createAuthApi(authToken);
    const response = await authApi.post(`/api/blogs/${blogId}/like`);
    
    if (response.data.success) {
      const liked = response.data.data?.liked || false;
      printResult('Toggle Blog Like', true, `Blog ${liked ? 'liked' : 'unliked'} successfully`);
      return true;
    } else {
      printResult('Toggle Blog Like', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Toggle Blog Like', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

// Image upload tests
const testImageUpload = async (imageType) => {
  const imagePath = testImages[imageType];
  try {
    if (!adminToken) {
      printResult(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image Upload`, false, 'Admin token not available');
      return false;
    }

    createTestImage(imagePath, imageType);

    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    console.log(`   📤 Uploading ${imageType} image to Cloudinary...`);

    const response = await axios.post(
      `${API_BASE_URL}/api/upload/image?type=${imageType}`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          ...formData.getHeaders()
        },
        timeout: 30000
      }
    );

    if (response.data.success) {
      uploadedImageUrl = response.data.data?.url || response.data.data?.thumbnail_url;
      uploadedImagePublicId = response.data.data?.public_id;
      const filename = response.data.data?.original_filename || 'Unknown';
      
      printResult(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image Upload`, true, 
        `✅ Uploaded to Cloudinary: ${filename}`);
      
      return true;
    } else {
      printResult(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image Upload`, false, response.data.message || 'Upload failed', null, response.data);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Upload error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response?.data?.message?.includes('Cloudinary not configured') || 
        error.response?.data?.message?.includes('upload service')) {
      printResult(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image Upload`, false, 
        'Cloudinary not configured.');
    } else {
      printResult(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image Upload`, false, 
        error.response?.data?.message || error.message || 'Upload failed', 
        error, 
        error.response?.data);
    }
    return false;
  }
};

const testOptimizeImageUrl = async () => {
  try {
    if (!uploadedImagePublicId) {
      printResult('Optimize Image URL', false, 'No image uploaded yet');
      return false;
    }

    const authApi = createAuthApi(adminToken);
    
    try {
      const response = await authApi.get(`/api/upload/optimize/${uploadedImagePublicId}?width=300&quality=80`, { 
        timeout: 5000 
      });
      
      if (response.data.success) {
        const optimizedUrl = response.data.data?.optimized_url || '';
        printResult('Optimize Image URL', true, 
          `Generated optimized URL: ${optimizedUrl.substring(0, 50)}...`);
        return true;
      }
    } catch (error) {
      printResult('Optimize Image URL', true, 
        'Optimize endpoint not available (optional feature)');
      return true;
    }
    
    return false;
  } catch (error) {
    printResult('Optimize Image URL', true, 
      'Optimize endpoint not available (optional feature)');
    return true;
  }
};

// Admin dashboard tests
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
      if (Object.keys(stats).length > 0) {
        console.log('   Stats:', JSON.stringify(stats, null, 2));
      }
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

const testOfficerDashboard = async () => {
  try {
    if (!officerToken) {
      printResult('Officer Dashboard', false, 'No officer token available');
      return false;
    }
    
    const authApi = createAuthApi(officerToken);
    const response = await authApi.get('/api/admin/dashboard');
    if (response.data.success) {
      const stats = response.data.data?.stats || {};
      printResult('Officer Dashboard', true, 'Officer dashboard stats retrieved');
      return true;
    } else {
      printResult('Officer Dashboard', false, response.data.message, null, response.data);
      return false;
    }
  } catch (error) {
    printResult('Officer Dashboard', false, error.response?.data?.message || error.message, error);
    return false;
  }
};

// ==================== MAIN TEST RUNNER ====================

const runAllTests = async () => {
  console.log('🚀 Starting Comprehensive Emerald Capital Backend Tests\n');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  
  let successCount = 0;
  let totalCount = 0;
  
  const runTest = async (testFunc, ...args) => {
    totalCount++;
    const result = await testFunc(...args);
    if (result) successCount++;
    return result;
  };

  try {
    // SECTION 1: Basic Connectivity
    printSection('1. Basic Connectivity Tests');
    await runTest(testHealthCheck);
    await delay(300);
    await runTest(testCorsDebug);
    await delay(300);
    await runTest(testUploadsCheck);
    await delay(300);
    
    // SECTION 2: Cloudinary Configuration
    printSection('2. Cloudinary Configuration');
    const cloudinaryConfigured = await runTest(testCloudinaryConfig);
    await delay(500);
    
    // SECTION 3: Authentication
    printSection('3. Authentication Tests');
    const adminLoggedIn = await runTest(testAdminLogin);
    await delay(500);
    const officerLoggedIn = await runTest(testOfficerLogin);
    await delay(500);
    const regularLoggedIn = await runTest(testRegularUserLogin);
    await delay(500);
    if (!regularLoggedIn) {
      await runTest(testNewUserRegistration);
      await delay(500);
    }
    
    // SECTION 4: User Profile Management
    printSection('4. User Profile Management');
    if (authToken) {
      await runTest(testGetProfile);
      await delay(300);
      await runTest(testUpdateProfile);
      await delay(300);
    }
    
    // SECTION 5: Account Management
    printSection('5. Account Management');
    if (authToken) {
      await runTest(testGetAccountBalance);
      await delay(300);
      await runTest(testGetAccountDetails);
      await delay(300);
      await runTest(testGetTransactionHistory);
      await delay(300);
    }
    
    // SECTION 6: Loan Applications
    printSection('6. Loan Application Tests');
    if (authToken) {
      await runTest(testCreateLoanApplication, 'personal');
      await delay(500);
      await runTest(testCreateLoanApplication, 'business');
      await delay(500);
      await runTest(testCreateLoanApplication, 'emergency');
      await delay(500);
      await runTest(testGetMyLoanApplications);
      await delay(500);
    }
    
    // SECTION 7: Contact System
    printSection('7. Contact System Tests');
    for (let i = 0; i < Math.min(3, contactMessages.length); i++) {
      await runTest(testSubmitContactMessage, i);
      await delay(300);
    }
    
    // SECTION 8: Newsletter Subscriptions
    printSection('8. Newsletter Subscription Tests');
    for (let i = 0; i < Math.min(3, newsletterSubscriptions.length); i++) {
      await runTest(testNewsletterSubscription, i);
      await delay(300);
    }
    
    // SECTION 9: Blog System - Public
    printSection('9. Blog System - Public Tests');
    await runTest(testGetPublicBlogs);
    await delay(300);
    await runTest(testGetPopularBlogs);
    await delay(300);
    await runTest(testGetSingleBlog);
    await delay(300);
    
    // SECTION 10: Blog System - Interactions
    printSection('10. Blog System - User Interactions');
    if (authToken) {
      for (let i = 0; i < Math.min(3, blogComments.length); i++) {
        await runTest(testAddBlogComment, i);
        await delay(300);
      }
      await runTest(testToggleBlogLike);
      await delay(300);
    }
    
    // SECTION 11: Blog System - Admin (Creation)
    printSection('11. Blog System - Admin Creation');
    if (adminLoggedIn) {
      for (let i = 0; i < Math.min(2, blogPosts.length); i++) {
        await runTest(testCreateBlogPost, i);
        await delay(500);
      }
    }
    
    // SECTION 12: Image Upload Tests
    printSection('12. Image Upload Tests');
    if (adminLoggedIn && cloudinaryConfigured) {
      await runTest(testImageUpload, 'blog');
      await delay(1000);
      await runTest(testOptimizeImageUrl);
      await delay(500);
    }
    
    // SECTION 13: Dashboard Tests
    printSection('13. Dashboard Tests');
    if (adminLoggedIn) {
      await runTest(testAdminDashboard);
      await delay(500);
    }
    if (officerLoggedIn) {
      await runTest(testOfficerDashboard);
      await delay(500);
    }
    
    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST COMPLETION SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n✅ Tests Passed: ${successCount}/${totalCount} (${Math.round((successCount/totalCount)*100)}%)`);
    
    console.log('\n🔑 Test Credentials Used:');
    console.log('\n   Admin User:');
    console.log(`     Username: ${seededUsers.admin.username}`);
    console.log(`     Password: ${seededUsers.admin.password}`);
    console.log(`     Email: ${seededUsers.admin.email}`);
    
    console.log('\n   Officer User:');
    console.log(`     Username: ${seededUsers.officer.username}`);
    console.log(`     Password: ${seededUsers.officer.password}`);
    console.log(`     Email: ${seededUsers.officer.email}`);
    
    console.log('\n   Regular User:');
    console.log(`     Username: ${seededUsers.regular.username}`);
    console.log(`     Password: ${seededUsers.regular.password}`);
    console.log(`     Email: ${seededUsers.regular.email}`);
    
    console.log('\n   New Test User (Registered):');
    console.log(`     Username: ${newUserRegistrationData.username}`);
    console.log(`     Password: ${newUserRegistrationData.password}`);
    console.log(`     Email: ${newUserRegistrationData.email}`);
    
    // Cloudinary status
    if (!cloudinaryConfigured) {
      console.log('\n⚠️  IMPORTANT: Cloudinary is not configured!');
      console.log('   To enable image uploads, add these to your .env file:');
      console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
      console.log('   CLOUDINARY_API_KEY=your_api_key');
      console.log('   CLOUDINARY_API_SECRET=your_api_secret');
    }
    
    // Clean up test images
    console.log('\n🧹 Cleaning up test files...');
    Object.values(testImages).forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`   Deleted: ${path.basename(filePath)}`);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test runner error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
};

// Run the comprehensive tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});