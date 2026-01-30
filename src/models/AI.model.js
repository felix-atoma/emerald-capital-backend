import mongoose from 'mongoose';

const AIGenerationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    default: null
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  service: {
    type: String,
    enum: ['openai', 'gemini', 'claude', 'local'],
    default: 'openai'
  },
  contentType: {
    type: String,
    enum: ['blog_post', 'article', 'social_media', 'meta_description', 'email_newsletter'],
    default: 'blog_post'
  },
  tone: {
    type: String,
    enum: ['professional', 'conversational', 'authoritative', 'friendly', 'technical'],
    default: 'professional'
  },
  length: {
    type: String,
    enum: ['short', 'medium', 'long', 'comprehensive'],
    default: 'medium'
  },
  keywords: [{
    type: String
  }],
  wordCount: {
    type: Number,
    required: true
  },
  creditsUsed: {
    type: Number,
    default: 0
  },
  estimatedReadTime: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['generated', 'saved', 'published', 'archived'],
    default: 'generated'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
AIGenerationSchema.index({ user: 1, createdAt: -1 });
AIGenerationSchema.index({ service: 1, contentType: 1 });
AIGenerationSchema.index({ title: 'text', content: 'text' });

// Pre-save middleware
AIGenerationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate word count if not provided
  if (!this.wordCount && this.content) {
    this.wordCount = this.content.split(/\s+/).length;
  }
  
  // Calculate estimated read time
  if (this.wordCount && !this.estimatedReadTime) {
    this.estimatedReadTime = Math.ceil(this.wordCount / 200); // 200 words per minute
  }
  
  next();
});

// Static methods
AIGenerationSchema.statics.getUserGenerations = async function(userId, limit = 20, skip = 0) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('blog', 'title slug')
    .populate('user', 'username email');
};

AIGenerationSchema.statics.getTotalCreditsUsed = async function(userId) {
  const result = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, totalCredits: { $sum: '$creditsUsed' } } }
  ]);
  
  return result.length > 0 ? result[0].totalCredits : 0;
};

AIGenerationSchema.statics.getStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { 
      $group: {
        _id: null,
        totalGenerations: { $sum: 1 },
        totalWords: { $sum: '$wordCount' },
        avgWords: { $avg: '$wordCount' },
        services: { 
          $push: { service: '$service', count: 1 } 
        },
        contentTypes: { 
          $push: { contentType: '$contentType', count: 1 } 
        }
      }
    },
    {
      $project: {
        totalGenerations: 1,
        totalWords: 1,
        avgWords: { $round: ['$avgWords', 2] },
        services: {
          $reduce: {
            input: '$services',
            initialValue: [],
            in: {
              $concatArrays: [
                '$$value',
                [
                  {
                    service: '$$this.service',
                    count: {
                      $sum: [
                        { $cond: [{ $eq: ['$$this.service', '$$value.service'] }, '$$value.count', 0] },
                        1
                      ]
                    }
                  }
                ]
              ]
            }
          }
        },
        contentTypes: {
          $reduce: {
            input: '$contentTypes',
            initialValue: [],
            in: {
              $concatArrays: [
                '$$value',
                [
                  {
                    contentType: '$$this.contentType',
                    count: {
                      $sum: [
                        { $cond: [{ $eq: ['$$this.contentType', '$$value.contentType'] }, '$$value.count', 0] },
                        1
                      ]
                    }
                  }
                ]
              ]
            }
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalGenerations: 0,
    totalWords: 0,
    avgWords: 0,
    services: [],
    contentTypes: []
  };
};

export const AIGeneration = mongoose.model('AIGeneration', AIGenerationSchema);