// seed-database.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import validator from 'validator';

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

    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    await User.deleteMany({ 
      email: { 
        $in: ['admin@emerald.com', 'john.doe@test.com', 'officer@emerald.com'] 
      } 
    });
    await Blog.deleteMany({});
    console.log('✅ Cleared existing test data\n');

    // Create Emerald Admin user
    console.log('👑 Creating Emerald Admin user...');
    const adminData = {
      sex: 'male',
      firstName: 'Emerald',
      lastName: 'Admin',
      middleName: 'System',
      dateOfBirth: new Date('1985-01-01'),
      phone: '0241111111',
      otherPhone: '0242222222',
      ghanaCardNumber: 'GHA-123456789-A', // Fixed format
      email: 'admin@emerald.com',
      homeAddress: 'Emerald Capital Headquarters, Accra, Ghana',
      region: 'Greater Accra',
      nextOfKin: [{
        relationship: 'spouse',
        firstName: 'Admin',
        lastName: 'Spouse'
      }],
      nextOfKinPhone: '0243333333',
      employmentType: ['private'],
      employer: 'Emerald Capital Ltd',
      staffNumber: 'EMERALD-ADMIN-001',
      employmentDate: new Date('2015-01-01'),
      gradeLevel: 'Administrator',
      lastMonthPay: 15000,
      username: 'EmeraldAdmin',
      password: 'Emerald@Admin1&$',
      isVerified: true,
      isActive: true,
      role: 'admin'
    };

    const adminUser = new User(adminData);
    await adminUser.save();
    console.log('✅ Emerald Admin user created');

    // Create regular test user
    console.log('\n👤 Creating regular test user...');
    const userData = {
      sex: 'male',
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Michael',
      dateOfBirth: new Date('1990-01-15'),
      phone: '0241234567',
      otherPhone: '0247654321',
      ghanaCardNumber: 'GHA-987654321-B', // Fixed format
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
      password: 'password123',
      isVerified: true,
      isActive: true,
      role: 'user'
    };

    const regularUser = new User(userData);
    await regularUser.save();
    console.log('✅ Regular user created');

    // Create officer user
    console.log('\n👮 Creating officer user...');
    const officerData = {
      sex: 'female',
      firstName: 'Sarah',
      lastName: 'Officer',
      middleName: 'Mensah',
      dateOfBirth: new Date('1988-06-20'),
      phone: '0245555555',
      otherPhone: '0246666666',
      ghanaCardNumber: 'GHA-555555555-C', // Fixed format
      email: 'officer@emerald.com',
      homeAddress: '456 Officer Avenue, Kumasi, Ghana',
      region: 'Ashanti',
      nextOfKin: [{
        relationship: 'sibling',
        firstName: 'David',
        lastName: 'Officer'
      }],
      nextOfKinPhone: '0247777777',
      employmentType: ['private'],
      employer: 'Emerald Capital Ltd',
      staffNumber: 'EMERALD-OFFICER-001',
      employmentDate: new Date('2018-03-15'),
      gradeLevel: 'Loan Officer',
      lastMonthPay: 8000,
      username: 'sarah.officer',
      password: 'Officer@123',
      isVerified: true,
      isActive: true,
      role: 'officer'
    };

    const officerUser = new User(officerData);
    await officerUser.save();
    console.log('✅ Officer user created');

    // Create test blogs
    console.log('\n📝 Creating test blogs...');
    
    const blogs = [
      {
        title: "Emerald Capital: Your Trusted Partner for Financial Growth in Ghana",
        excerpt: "Discover how Emerald Capital is revolutionizing the financial landscape in Ghana with innovative loan solutions, flexible repayment plans, and exceptional customer service.",
        content: `
          <h1>Welcome to Emerald Capital</h1>
          <p>At Emerald Capital, we believe that financial empowerment is the cornerstone of personal and business growth. As one of Ghana's leading financial service providers, we're committed to helping you achieve your financial goals.</p>
          
          <h2>Our Loan Products</h2>
          <p>We offer a wide range of loan products tailored to meet diverse needs:</p>
          
          <h3>1. Personal Loans</h3>
          <p>• Amount: GHS 1,000 - GHS 50,000</p>
          <p>• Tenure: 3 - 24 months</p>
          <p>• Purpose: Education, medical, home improvement, travel</p>
          
          <h3>2. Business Loans</h3>
          <p>• Amount: GHS 5,000 - GHS 500,000</p>
          <p>• Tenure: 6 - 60 months</p>
          <p>• Ideal for: Startups, expansion, equipment purchase</p>
          
          <h3>3. Salary Advance Loans</h3>
          <p>• Amount: Up to 50% of monthly salary</p>
          <p>• Tenure: 1 month (repayable on next payday)</p>
          <p>• Quick disbursement: Within 24 hours</p>
          
          <h2>Why Choose Emerald Capital?</h2>
          <ul>
            <li><strong>Competitive Interest Rates:</strong> Lower than industry average</li>
            <li><strong>Flexible Repayment:</strong> Customized to your cash flow</li>
            <li><strong>Quick Approval:</strong> 48-hour processing for complete applications</li>
            <li><strong>No Hidden Charges:</strong> Transparent fee structure</li>
            <li><strong>Digital Platform:</strong> Apply and manage loans online</li>
            <li><strong>Customer Support:</strong> Dedicated relationship managers</li>
          </ul>
          
          <h2>Eligibility Criteria</h2>
          <p>To qualify for an Emerald Capital loan, you need to:</p>
          <p>• Be a Ghanaian citizen aged 21-60 years</p>
          <p>• Have a regular source of income</p>
          <p>• Provide valid Ghana Card</p>
          <p>• Have an active bank account</p>
          <p>• Provide proof of address</p>
          
          <h2>How to Apply</h2>
          <p>1. <strong>Register:</strong> Create your account on our platform</p>
          <p>2. <strong>Complete Profile:</strong> Provide required documents</p>
          <p>3. <strong>Choose Loan:</strong> Select product and amount</p>
          <p>4. <strong>Submit Application:</strong> Our team will review</p>
          <p>5. <strong>Get Approved:</strong> Sign agreement and receive funds</p>
          
          <p>Join thousands of satisfied customers who have transformed their financial lives with Emerald Capital. Your journey to financial freedom starts here!</p>
        `,
        category: "Company News",
        author: "Emerald Admin",
        authorId: adminUser._id,
        readTime: 10,
        views: 1500,
        likes: [regularUser._id, officerUser._id],
        isFeatured: true,
        isPublished: true,
        tags: ['emerald capital', 'loans', 'finance', 'ghana', 'personal loans', 'business loans']
      },
      {
        title: "Understanding Loan Interest Rates in Ghana: Fixed vs Variable Explained",
        excerpt: "Get expert insights into different types of interest rates and learn how to choose the best option for your financial situation in Ghana's lending market.",
        content: `
          <h1>Demystifying Loan Interest Rates in Ghana</h1>
          <p>Understanding interest rates is crucial when taking out a loan. In Ghana, lenders typically offer two main types of interest rates: fixed and variable. Each has its advantages and considerations.</p>
          
          <h2>Fixed Interest Rates</h2>
          <h3>What are they?</h3>
          <p>A fixed interest rate remains constant throughout the loan tenure. Your monthly payments stay the same, making budgeting predictable.</p>
          
          <h3>Advantages:</h3>
          <ul>
            <li><strong>Predictability:</strong> Know exactly what you'll pay each month</li>
            <li><strong>Budgeting Ease:</strong> Easy to plan your finances</li>
            <li><strong>Protection:</strong> Shielded from market rate increases</li>
          </ul>
          
          <h3>Considerations:</h3>
          <ul>
            <li>Usually slightly higher than initial variable rates</li>
            <li>No benefit if market rates decrease</li>
          </ul>
          
          <h2>Variable Interest Rates</h2>
          <h3>What are they?</h3>
          <p>Variable rates fluctuate based on market conditions, often tied to the Bank of Ghana's policy rate or interbank rates.</p>
          
          <h3>Advantages:</h3>
          <ul>
            <li><strong>Lower Initial Rate:</strong> Often start lower than fixed rates</li>
            <li><strong>Potential Savings:</strong> Can benefit from rate decreases</li>
          </ul>
          
          <h3>Considerations:</h3>
          <ul>
            <li><strong>Uncertainty:</strong> Monthly payments can change</li>
            <li><strong>Risk:</strong> Payments increase if rates go up</li>
            <li><strong>Budgeting Challenge:</strong> Harder to plan long-term</li>
          </ul>
          
          <h2>Current Market Trends in Ghana</h2>
          <p>As of 2024, interest rates in Ghana typically range from:</p>
          <ul>
            <li><strong>Personal Loans:</strong> 24% - 36% per annum</li>
            <li><strong>Business Loans:</strong> 20% - 30% per annum</li>
            <li><strong>Mortgages:</strong> 18% - 25% per annum</li>
          </ul>
          
          <h2>Factors Affecting Your Interest Rate</h2>
          <p>Lenders consider several factors when determining your rate:</p>
          <ol>
            <li><strong>Credit Score:</strong> Higher scores get better rates</li>
            <li><strong>Loan Amount:</strong> Larger loans may get preferential rates</li>
            <li><strong>Tenure:</strong> Shorter terms often have lower rates</li>
            <li><strong>Income Stability:</strong> Regular income can lower your rate</li>
            <li><strong>Collateral:</strong> Secured loans typically have lower rates</li>
          </ol>
          
          <h2>Tips for Getting the Best Rate</h2>
          <p>1. <strong>Improve Your Credit Score:</strong> Pay bills on time, reduce debt</p>
          <p>2. <strong>Compare Lenders:</strong> Shop around for the best offer</p>
          <p>3. <strong>Negotiate:</strong> Don't accept the first offer</p>
          <p>4. <strong>Consider a Co-signer:</strong> Someone with better credit can help</p>
          <p>5. <strong>Choose the Right Tenure:</strong> Balance monthly payments with total interest</p>
          
          <h2>Emerald Capital's Approach</h2>
          <p>At Emerald Capital, we offer:</p>
          <ul>
            <li><strong>Competitive Fixed Rates:</strong> For customers who value predictability</li>
            <li><strong>Customized Solutions:</strong> Rates tailored to your profile</li>
            <li><strong>Transparent Pricing:</strong> No hidden fees or charges</li>
            <li><strong>Rate Match Guarantee:</strong> We'll match any genuine lower rate</li>
          </ul>
          
          <p>Remember, the lowest interest rate isn't always the best deal. Consider all factors including fees, flexibility, and customer service when choosing a lender.</p>
        `,
        category: "Financial Education",
        author: "Sarah Officer",
        authorId: officerUser._id,
        readTime: 12,
        views: 3200,
        likes: [adminUser._id, regularUser._id],
        isFeatured: true,
        isPublished: true,
        tags: ['interest rates', 'loans', 'finance education', 'ghana', 'banking']
      },
      {
        title: "5 Steps to Build Your Emergency Fund: A Ghanaian Perspective",
        excerpt: "Learn practical strategies to build a financial safety net that can protect you during unexpected situations, tailored to the Ghanaian economic context.",
        content: `
          <h1>Building Your Emergency Fund in Ghana</h1>
          <p>An emergency fund is your financial safety net - money set aside to cover unexpected expenses like medical emergencies, job loss, or urgent repairs. In Ghana's economic climate, having this cushion is more important than ever.</p>
          
          <h2>Why You Need an Emergency Fund</h2>
          <ul>
            <li><strong>Avoid Debt:</strong> Prevents taking high-interest loans for emergencies</li>
            <li><strong>Peace of Mind:</strong> Reduces financial stress</li>
            <li><strong>Financial Independence:</strong> Don't need to borrow from friends/family</li>
            <li><strong>Opportunity Fund:</strong> Can seize good investment opportunities</li>
          </ul>
          
          <h2>How Much Do You Need?</h2>
          <p><strong>Starter Goal:</strong> 1 month of expenses (GHS 2,000 - GHS 5,000 for most Ghanaians)</p>
          <p><strong>Intermediate Goal:</strong> 3 months of expenses</p>
          <p><strong>Full Protection:</strong> 6 months of expenses</p>
          
          <h2>Step-by-Step Guide</h2>
          
          <h3>Step 1: Calculate Your Monthly Expenses</h3>
          <p>Track all your expenses for one month:</p>
          <ul>
            <li>Rent/Mortgage</li>
            <li>Utilities (electricity, water, internet)</li>
            <li>Food and groceries</li>
            <li>Transportation</li>
            <li>School fees (if applicable)</li>
            <li>Insurance premiums</li>
            <li>Other essentials</li>
          </ul>
          
          <h3>Step 2: Set Your Target</h3>
          <p>Multiply your monthly expenses by the number of months you want to cover. Example:</p>
          <p>Monthly expenses: GHS 3,000</p>
          <p>3-month fund target: GHS 9,000</p>
          <p>6-month fund target: GHS 18,000</p>
          
          <h3>Step 3: Choose Where to Keep It</h3>
          <p>Your emergency fund should be:</p>
          <ul>
            <li><strong>Accessible:</strong> Available within 24-48 hours</li>
            <li><strong>Safe:</strong> Not subject to market fluctuations</li>
            <li><strong>Separate:</strong> Different from your regular account</li>
          </ul>
          
          <p>Good options in Ghana:</p>
          <ul>
            <li>Savings account at a reputable bank</li>
            <li>Money market funds</li>
            <li>Treasury bills (for portion of fund)</li>
            <li>Mobile money savings (for small amounts)</li>
          </ul>
          
          <h3>Step 4: Start Small and Be Consistent</h3>
          <p>Don't wait to save large amounts. Start with what you can:</p>
          <ul>
            <li>Save 10% of your monthly income</li>
            <li>Save windfalls (bonuses, tax refunds)</li>
            <li>Cut one unnecessary expense each month</li>
            <li>Use the "spare change" method</li>
          </ul>
          
          <h3>Step 5: Automate Your Savings</h3>
          <p>Set up automatic transfers:</p>
          <ul>
            <li>Schedule transfer on payday</li>
            <li>Use bank standing orders</li>
            <li>Set up mobile money auto-save</li>
            <li>Use savings apps with automation</li>
          </ul>
          
          <h2>Ghana-Specific Tips</h2>
          <p><strong>1. Susu Contributions:</strong> Traditional savings method that enforces discipline</p>
          <p><strong>2. Fixed Deposit Accounts:</strong> Earn interest while keeping funds safe</p>
          <p><strong>3. Government Bonds:</strong> Consider for longer-term emergency funds</p>
          <p><strong>4. Avoid 'Sika Mpepee':</strong> Resist the temptation to spend your fund</p>
          
          <h2>When to Use Your Emergency Fund</h2>
          <p><strong>✅ Legitimate Emergencies:</strong></p>
          <ul>
            <li>Medical emergencies not covered by NHIS</li>
            <li>Unexpected job loss</li>
            <li>Essential home/car repairs</li>
            <li>Family emergencies</li>
          </ul>
          
          <p><strong>❌ NOT for:</strong></p>
          <ul>
            <li>Holiday shopping</li>
            <li>Latest smartphone</li>
            <li>Wedding expenses (unless absolutely necessary)</li>
            <li>Non-essential upgrades</li>
          </ul>
          
          <h2>Rebuilding After Use</h2>
          <p>If you dip into your emergency fund:</p>
          <ol>
            <li>Pause other savings temporarily</li>
            <li>Increase your monthly contribution</li>
            <li>Look for additional income sources</li>
            <li>Cut discretionary spending until rebuilt</li>
          </ol>
          
          <p>Remember: Building an emergency fund is a marathon, not a sprint. Start today, be consistent, and watch your financial security grow!</p>
        `,
        category: "Savings",
        author: "Emerald Admin",
        authorId: adminUser._id,
        readTime: 15,
        views: 5400,
        likes: [adminUser._id, regularUser._id, officerUser._id],
        bookmarks: [regularUser._id],
        comments: [{
          user: regularUser._id,
          text: "Very practical advice! I've started my emergency fund using these tips.",
          name: "John Doe",
          createdAt: new Date('2024-01-15')
        }],
        isFeatured: true,
        isPublished: true,
        tags: ['emergency fund', 'savings', 'financial planning', 'ghana', 'personal finance']
      }
    ];

    let blogsCreated = 0;

    for (const blogData of blogs) {
      const blog = new Blog(blogData);
      await blog.save();
      blogsCreated++;
      console.log(`✅ Created: ${blogData.title}`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Users created: 3`);
    console.log(`✅ Blogs created: ${blogsCreated}`);
    console.log(`📚 Total blogs in database: ${await Blog.countDocuments()}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('\n👑 Emerald Admin:');
    console.log('  Username: EmeraldAdmin');
    console.log('  Password: Emerald@Admin1&$');
    console.log('  Email: admin@emerald.com');
    console.log('  Role: Admin');
    
    console.log('\n👮 Officer User:');
    console.log('  Username: sarah.officer');
    console.log('  Password: Officer@123');
    console.log('  Email: officer@emerald.com');
    console.log('  Role: Officer');
    
    console.log('\n👤 Regular User:');
    console.log('  Username: johndoe');
    console.log('  Password: password123');
    console.log('  Email: john.doe@test.com');
    console.log('  Role: User');
    
    console.log('\n💡 Note: All users have "isVerified: true" and "isActive: true"');
    console.log('\n🚀 You can now test the application with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error('Error details:', error.stack);
    process.exit(1);
  }
};

seedDatabase();