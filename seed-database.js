// seed-database.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Define the User schema inline since we're seeding
const userSchema = new mongoose.Schema({
  sex: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  middleName: {
    type: String,
    trim: true,
    maxlength: [50, 'Middle name cannot exceed 50 characters'],
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-()]{10,}$/.test(v);
      },
      message: 'Please enter a valid phone number',
    },
  },
  otherPhone: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\+?[\d\s-()]{10,}$/.test(v);
      },
      message: 'Please enter a valid phone number',
    },
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  ghanaCardNumber: {
    type: String,
    required: [true, 'Ghana Card number is required'],
    unique: true,
    uppercase: true,
    match: [/^GHA-[A-Z0-9]{9}-[A-Z0-9]$/, 'Please provide a valid Ghana Card number'],
  },
  homeAddress: {
    type: String,
    required: [true, 'Home address is required'],
    maxlength: [255, 'Address cannot exceed 255 characters'],
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    enum: [
      'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 
      'Northern', 'Upper East', 'Upper West', 'Volta', 'Bono',
      'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
    ],
  },
  nextOfKin: [{
    relationship: {
      type: String,
      enum: ['spouse', 'parent', 'child', 'sibling', 'other'],
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
  }],
  nextOfKinPhone: {
    type: String,
    required: [true, 'Next of kin phone is required'],
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-()]{10,}$/.test(v);
      },
      message: 'Please enter a valid phone number',
    },
  },
  employmentType: [{
    type: String,
    enum: [
      'civilService', 'police', 'military', 'immigration', 'fire',
      'education', 'health', 'private', 'other'
    ],
  }],
  employer: {
    type: String,
    required: [true, 'Employer is required'],
    trim: true,
  },
  staffNumber: {
    type: String,
    required: [true, 'Staff number is required'],
    trim: true,
  },
  employmentDate: {
    type: Date,
    required: [true, 'Employment date is required'],
  },
  gradeLevel: {
    type: String,
    required: [true, 'Grade level is required'],
    trim: true,
  },
  lastMonthPay: {
    type: Number,
    required: [true, 'Last month pay is required'],
    min: [0, 'Salary cannot be negative'],
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    minlength: [4, 'Username must be at least 4 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'officer'],
    default: 'user',
  },
  lastLogin: Date,
}, {
  timestamps: true,
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

// Blog schema
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    maxlength: [500, 'Excerpt cannot exceed 500 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  featuredImage: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  readTime: {
    type: Number,
    default: 5,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    name: String,
    avatar: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  tags: [{
    type: String,
  }],
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  metaTitle: String,
  metaDescription: String,
}, {
  timestamps: true,
});

// Generate slug before saving
blogSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

const seedDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Clear existing test data (optional - uncomment if you want fresh data)
    // await User.deleteMany({ email: { $in: ['admin@test.com', 'john.doe@test.com'] } });
    // await Blog.deleteMany({});
    // console.log('🧹 Cleared existing test data\n');

    // Check if users already exist
    console.log('👥 Checking existing users...');
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    const existingUser = await User.findOne({ email: 'john.doe@test.com' });

    // Admin user data - ALL required fields
    const adminData = {
      sex: 'male',
      firstName: 'Admin',
      lastName: 'User',
      middleName: 'System',
      dateOfBirth: new Date('1985-01-01'),
      phone: '0241111111',
      otherPhone: '0242222222',
      ghanaCardNumber: 'GHA-987654321-B',
      email: 'admin@test.com',
      homeAddress: '456 Admin Street, Accra, Ghana',
      region: 'Greater Accra',
      nextOfKin: [{
        relationship: 'spouse',
        firstName: 'Admin',
        lastName: 'Spouse'
      }],
      nextOfKinPhone: '0243333333',
      employmentType: ['private'],
      employer: 'Emerald Capital Ltd',
      staffNumber: 'ADM001',
      employmentDate: new Date('2015-01-01'),
      gradeLevel: 'Director',
      lastMonthPay: 10000,
      username: 'adminuser',
      password: 'admin123', // Will be hashed by pre-save hook
      agreementConfirmed: true,
      isActive: true,
      role: 'admin'
    };

    // Regular user data - ALL required fields
    const userData = {
      sex: 'male',
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Michael',
      dateOfBirth: new Date('1990-01-15'),
      phone: '0241234567',
      otherPhone: '0247654321',
      ghanaCardNumber: 'GHA-123456789-A',
      email: 'john.doe@test.com',
      homeAddress: '123 Test Street, Accra, Ghana',
      region: 'Greater Accra',
      nextOfKin: [{
        relationship: 'spouse',
        firstName: 'Jane',
        lastName: 'Doe'
      }],
      nextOfKinPhone: '0249876543',
      employmentType: ['private'],
      employer: 'Test Company Ltd',
      staffNumber: 'EMP001',
      employmentDate: new Date('2020-01-01'),
      gradeLevel: 'Manager',
      lastMonthPay: 5000,
      username: 'johndoe',
      password: 'password123', // Will be hashed by pre-save hook
      agreementConfirmed: true,
      isActive: true,
      role: 'user'
    };

    // Create or update admin user
    console.log('\n👨‍💼 Creating/updating admin user...');
    let adminUser;
    if (existingAdmin) {
      // Update password if it's being changed
      if (adminData.password && adminData.password !== 'admin123') {
        adminData.password = await bcrypt.hash(adminData.password, 12);
      }
      Object.assign(existingAdmin, adminData);
      await existingAdmin.save();
      adminUser = existingAdmin;
      console.log('✅ Admin user updated');
    } else {
      // Create new admin - password will be hashed by pre-save hook
      adminUser = new User(adminData);
      await adminUser.save();
      console.log('✅ Admin user created');
    }

    // Create or update regular user
    console.log('\n👤 Creating/updating regular user...');
    let regularUser;
    if (existingUser) {
      // Update password if it's being changed
      if (userData.password && userData.password !== 'password123') {
        userData.password = await bcrypt.hash(userData.password, 12);
      }
      Object.assign(existingUser, userData);
      await existingUser.save();
      regularUser = existingUser;
      console.log('✅ Regular user updated');
    } else {
      // Create new user - password will be hashed by pre-save hook
      regularUser = new User(userData);
      await regularUser.save();
      console.log('✅ Regular user created');
    }

    // Create test blogs
    console.log('\n📝 Creating test blogs...');
    
    const blogs = [
      {
        title: "Enhancing Your Credit Score: 5 Effective Tips to Secure a Loan in Ghana",
        excerpt: "Master the art of credit management with proven strategies that can significantly improve your credit score and increase your loan approval chances in Ghana's competitive financial landscape.",
        content: `
          <h1>Enhancing Your Credit Score in Ghana</h1>
          <p>Your credit score is one of the most important factors that lenders consider when evaluating your loan application. In Ghana, maintaining a good credit score can mean the difference between getting approved for that crucial business loan or being turned down.</p>
          
          <h2>1. Pay Your Bills on Time</h2>
          <p>Payment history accounts for 35% of your credit score. Ensure you pay all your bills – including utility bills, mobile money loans, and existing loans – on or before their due dates.</p>
          
          <h2>2. Keep Credit Utilization Low</h2>
          <p>Try to use less than 30% of your available credit at any given time. High credit utilization can signal financial distress to lenders.</p>
          
          <h2>3. Maintain a Mix of Credit Types</h2>
          <p>Having different types of credit (installment loans, credit cards, mobile money loans) shows lenders you can handle various financial responsibilities.</p>
          
          <h2>4. Avoid Multiple Loan Applications</h2>
          <p>Each loan application creates a hard inquiry on your credit report. Too many inquiries in a short period can lower your score.</p>
          
          <h2>5. Monitor Your Credit Report Regularly</h2>
          <p>Check your credit report at least once a year for errors. You're entitled to one free credit report annually from credit bureaus in Ghana.</p>
          
          <p>By following these tips consistently, you can improve your credit score over time and increase your chances of securing favorable loan terms from financial institutions across Ghana.</p>
        `,
        category: "Credit & Loans",
        author: "Michael Boateng",
        authorId: adminUser._id,
        readTime: 6,
        views: 2450,
        likes: [regularUser._id],
        isFeatured: true,
        isPublished: true,
        tags: ['credit score', 'loans', 'finance', 'ghana', 'banking']
      },
      {
        title: "Understanding Mobile Money Loans in Ghana: A Complete Guide",
        excerpt: "Explore the revolutionary world of mobile money services that have transformed financial access, making quick loans more accessible than ever for Ghanaian individuals and businesses.",
        content: `
          <h1>The Mobile Money Loan Revolution in Ghana</h1>
          <p>Mobile money has completely transformed the financial landscape in Ghana, making financial services accessible to millions who were previously unbanked. One of the most significant developments has been the rise of mobile money loans.</p>
          
          <h2>What Are Mobile Money Loans?</h2>
          <p>Mobile money loans are short-term loans disbursed and repaid through mobile money platforms like MTN MoMo, Vodafone Cash, and AirtelTigo Money. These loans typically range from GHS 50 to GHS 5,000 with repayment periods of 7 to 90 days.</p>
          
          <h2>How Do They Work?</h2>
          <p>1. <strong>Application:</strong> Through USSD codes, mobile apps, or SMS</p>
          <p>2. <strong>Approval:</strong> Automated based on your transaction history</p>
          <p>3. <strong>Disbursement:</strong> Funds sent directly to your mobile wallet</p>
          <p>4. <strong>Repayment:</strong> Automatic deduction or manual payment</p>
          
          <h2>Key Providers in Ghana</h2>
          <ul>
            <li><strong>MTN MoMo Loan:</strong> Up to GHS 1,000 for existing MTN Mobile Money users</li>
            <li><strong>Vodafone Cash Loan:</strong> Quick loans for Vodafone Cash subscribers</li>
            <li><strong>AirtelTigo Money Loan:</strong> Loans for AirtelTigo Money users</li>
            <li><strong>Bank-backed Solutions:</strong> Partnerships like Fidelity Bank's Quick Loan</li>
          </ul>
          
          <h2>Advantages</h2>
          <p>• Instant access to funds</p>
          <p>• No collateral required</p>
          <p>• Convenient application process</p>
          <p>• Builds credit history</p>
          
          <h2>Things to Consider</h2>
          <p>• Higher interest rates than traditional banks</p>
          <p>• Short repayment periods</p>
          <p>• Default penalties can be steep</p>
          <p>• Limited loan amounts</p>
          
          <p>Mobile money loans have democratized access to credit in Ghana, but they should be used responsibly as part of a broader financial strategy.</p>
        `,
        category: "Digital Banking",
        author: "Sarah Mensah",
        authorId: adminUser._id,
        readTime: 8,
        views: 4320,
        likes: [adminUser._id, regularUser._id],
        isPublished: true,
        tags: ['mobile money', 'digital loans', 'fintech', 'ghana', 'banking']
      }
    ];

    let blogsCreated = 0;
    let blogsSkipped = 0;

    for (const blogData of blogs) {
      const existingBlog = await Blog.findOne({ title: blogData.title });
      if (!existingBlog) {
        // Generate slug automatically
        const blog = new Blog(blogData);
        await blog.save();
        blogsCreated++;
        console.log(`✅ Created: ${blogData.title}`);
      } else {
        blogsSkipped++;
        console.log(`⏭️  Skipped (exists): ${blogData.title}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Users created/updated: 2`);
    console.log(`✅ Blogs created: ${blogsCreated}`);
    console.log(`⏭️  Blogs skipped: ${blogsSkipped}`);
    console.log(`📚 Total blogs in database: ${await Blog.countDocuments()}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Test Credentials:');
    console.log('Admin User:');
    console.log('  Username: adminuser');
    console.log('  Password: admin123');
    console.log('  Email: admin@test.com');
    console.log('\nRegular User:');
    console.log('  Username: johndoe');
    console.log('  Password: password123');
    console.log('  Email: john.doe@test.com');
    
    console.log('\n🚀 You can now run the endpoint tests.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error('Error details:', error.stack);
    process.exit(1);
  }
};

// Import validator for email validation
import validator from 'validator';

seedDatabase();