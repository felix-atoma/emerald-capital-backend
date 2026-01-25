// test-blog-api.js
import mongoose from 'mongoose';
import Blog from './src/models/Blog.js';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'http://localhost:5000/api');
    console.log('✅ Connected to MongoDB');
    
    // Test if Blog model works
    const count = await Blog.countDocuments();
    console.log(`📊 Total blogs in database: ${count}`);
    
    // Create a test blog if none exist
    if (count === 0) {
      console.log('📝 Creating test blog...');
      const testBlog = new Blog({
        title: 'Welcome to Emerald Capital Blog',
        slug: 'welcome-to-emerald-capital-blog',
        excerpt: 'This is a test blog post to get started.',
        content: 'This is the content of the test blog post.',
        category: 'Introduction',
        authorId: new mongoose.Types.ObjectId(),
        status: 'published',
        featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800'
      });
      
      await testBlog.save();
      console.log('✅ Test blog created');
    }
    
    // List all blogs
    const blogs = await Blog.find({}).limit(5);
    console.log('📋 Sample blogs:', blogs.map(b => ({
      id: b._id,
      title: b.title,
      slug: b.slug,
      status: b.status
    })));
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testConnection();