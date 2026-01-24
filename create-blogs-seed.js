// create-blogs-seed.js
import mongoose from 'mongoose';
import Blog from './src/models/Blog.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedBlogs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create an admin user
    let adminUser = await User.findOne({ username: 'adminuser' });
    
    if (!adminUser) {
      adminUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        phone: '0241111111',
        username: 'adminuser',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        agreementConfirmed: true
      });
    }

    // Create test blogs
    const blogs = [
      {
        title: "Enhancing Your Credit Score: 5 Effective Tips to Secure a Loan in Ghana",
        excerpt: "Master the art of credit management with proven strategies that can significantly improve your credit score.",
        content: "<h1>Enhancing Your Credit Score</h1><p>Credit management is crucial for financial success...</p>",
        category: "Credit & Loans",
        author: "Michael Boateng",
        authorId: adminUser._id,
        readTime: 6,
        views: 2450,
        featuredImage: '',
        isFeatured: true,
        isPublished: true,
        tags: ['credit', 'loans', 'finance']
      },
      {
        title: "Understanding Mobile Money Loans in Ghana",
        excerpt: "Explore the revolutionary world of mobile money services that have transformed financial access.",
        content: "<h1>Mobile Money Loans</h1><p>Mobile money has changed banking in Ghana...</p>",
        category: "Digital Banking",
        author: "Sarah Mensah",
        authorId: adminUser._id,
        readTime: 8,
        views: 4320,
        featuredImage: '',
        isPublished: true,
        tags: ['mobile money', 'digital', 'loans']
      }
    ];

    for (const blogData of blogs) {
      const existingBlog = await Blog.findOne({ title: blogData.title });
      if (!existingBlog) {
        await Blog.create(blogData);
        console.log(`Created blog: ${blogData.title}`);
      }
    }

    console.log('Blog seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding blogs:', error);
    process.exit(1);
  }
};

seedBlogs();