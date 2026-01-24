// controllers/blogController.js
import Blog from '../models/Blog.js';

// @desc    Get all blog posts
// @route   GET /api/blogs
// @access  Public
export const getBlogs = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Filtering
    const filter = { isPublished: true };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { excerpt: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Sorting
    let sort = { createdAt: -1 }; // Default: newest first
    
    // Execute query
    const blogs = await Blog.find(filter)
      .populate('authorId', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Blog.countDocuments(filter);
    
    // Check if user has bookmarked/liked (if authenticated)
    let enhancedBlogs = blogs;
    if (req.user) {
      enhancedBlogs = blogs.map(blog => {
        const blogObj = blog.toObject();
        blogObj.isLiked = blog.likes && blog.likes.some(
          like => like.toString() === req.user._id.toString()
        );
        blogObj.isBookmarked = blog.bookmarks && blog.bookmarks.some(
          bookmark => bookmark.toString() === req.user._id.toString()
        );
        return blogObj;
      });
    }
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: enhancedBlogs
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single blog post
// @route   GET /api/blogs/:slug
// @access  Public
export const getBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true })
      .populate('authorId', 'name email avatar bio')
      .populate('comments.user', 'name avatar');
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Increment views
    blog.views += 1;
    await blog.save();
    
    // Check if user has liked/bookmarked (if authenticated)
    let blogObj = blog.toObject();
    if (req.user) {
      blogObj.isLiked = blog.likes && blog.likes.some(
        like => like.toString() === req.user._id.toString()
      );
      blogObj.isBookmarked = blog.bookmarks && blog.bookmarks.some(
        bookmark => bookmark.toString() === req.user._id.toString()
      );
    }
    
    res.status(200).json({
      success: true,
      data: blogObj
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create blog post
// @route   POST /api/blogs
// @access  Private/Admin
export const createBlog = async (req, res) => {
  try {
    // Add author info
    req.body.authorId = req.user._id;
    if (!req.body.author) {
      req.body.author = req.user.name || 'Admin User';
    }
    
    const blog = await Blog.create(req.body);
    
    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update blog post
// @route   PUT /api/blogs/:id
// @access  Private/Admin
export const updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Check ownership
    if (blog.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }
    
    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Check ownership
    if (blog.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }
    
    await blog.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like blog post
// @route   PUT /api/blogs/:id/like
// @access  Private
export const likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Check if already liked - ANY authenticated user can like
    const alreadyLiked = blog.likes && blog.likes.some(
      like => like.toString() === req.user._id.toString()
    );
    
    if (alreadyLiked) {
      // Remove like
      blog.likes = blog.likes.filter(
        like => like.toString() !== req.user._id.toString()
      );
    } else {
      // Add like
      if (!blog.likes) blog.likes = [];
      blog.likes.push(req.user._id);
    }
    
    await blog.save();
    
    // Check updated status
    const isLiked = !alreadyLiked;
    const likesCount = blog.likes ? blog.likes.length : 0;
    
    res.status(200).json({
      success: true,
      isLiked,
      likesCount,
      data: blog
    });
  } catch (error) {
    console.error('Error liking blog:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bookmark blog post
// @route   PUT /api/blogs/:id/bookmark
// @access  Private
export const bookmarkBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Check if already bookmarked - ANY authenticated user can bookmark
    const alreadyBookmarked = blog.bookmarks && blog.bookmarks.some(
      bookmark => bookmark.toString() === req.user._id.toString()
    );
    
    if (alreadyBookmarked) {
      // Remove bookmark
      blog.bookmarks = blog.bookmarks.filter(
        bookmark => bookmark.toString() !== req.user._id.toString()
      );
    } else {
      // Add bookmark
      if (!blog.bookmarks) blog.bookmarks = [];
      blog.bookmarks.push(req.user._id);
    }
    
    await blog.save();
    
    // Check updated status
    const isBookmarked = !alreadyBookmarked;
    
    res.status(200).json({
      success: true,
      isBookmarked,
      data: blog
    });
  } catch (error) {
    console.error('Error bookmarking blog:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add comment to blog post
// @route   POST /api/blogs/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    const newComment = {
      user: req.user._id,
      text: req.body.text,
      name: req.user.name || req.user.firstName,
      avatar: req.user.avatar
    };
    
    if (!blog.comments) blog.comments = [];
    blog.comments.unshift(newComment);
    await blog.save();
    
    // Populate the new comment's user info
    const populatedBlog = await Blog.findById(blog._id)
      .populate('comments.user', 'name avatar');
    
    res.status(200).json({
      success: true,
      data: populatedBlog
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete comment from blog post
// @route   DELETE /api/blogs/:id/comments/:commentId
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Find comment
    const comment = blog.comments.find(
      comment => comment._id.toString() === req.params.commentId
    );
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check ownership
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }
    
    blog.comments = blog.comments.filter(
      comment => comment._id.toString() !== req.params.commentId
    );
    
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's bookmarked blogs
// @route   GET /api/blogs/bookmarks/my
// @access  Private
export const getMyBookmarks = async (req, res) => {
  try {
    const blogs = await Blog.find({ bookmarks: req.user._id, isPublished: true })
      .populate('authorId', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's liked blogs
// @route   GET /api/blogs/likes/my
// @access  Private
export const getMyLikes = async (req, res) => {
  try {
    const blogs = await Blog.find({ likes: req.user._id, isPublished: true })
      .populate('authorId', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching liked blogs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get popular blogs
// @route   GET /api/blogs/popular
// @access  Public
export const getPopularBlogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    
    const blogs = await Blog.find({ isPublished: true })
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .populate('authorId', 'name avatar')
      .select('title slug excerpt views featuredImage category createdAt likes')
      .lean(); // Use lean() for better performance with plain JavaScript objects
    
    // Add likes count to each blog safely
    const blogsWithLikesCount = blogs.map(blog => ({
      ...blog,
      likesCount: Array.isArray(blog.likes) ? blog.likes.length : 0
    }));
    
    res.status(200).json({
      success: true,
      count: blogsWithLikesCount.length,
      data: blogsWithLikesCount
    });
  } catch (error) {
    console.error('Error fetching popular blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Get blog statistics
// @route   GET /api/blogs/stats/summary
// @access  Private/Admin
export const getBlogStats = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ isPublished: true });
    const featuredBlogs = await Blog.countDocuments({ isFeatured: true });
    
    const totalViews = await Blog.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$views' }
        }
      }
    ]);
    
    const blogsByCategory = await Blog.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalBlogs,
        publishedBlogs,
        featuredBlogs,
        totalViews: totalViews[0]?.total || 0,
        blogsByCategory
      }
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};