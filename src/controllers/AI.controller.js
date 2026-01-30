import { AIService } from '../services/AIService.js';
import { AIGeneration } from '../models/AI.model.js';
import mongoose from 'mongoose';

export class AIController {
  // Generate content with AI
  static async generateContent(req, res) {
    try {
      const { 
        title, 
        keywords = [], 
        contentType = 'blog_post', 
        tone = 'professional', 
        length = 'medium', 
        outline,
        service = 'openai',
        blogId 
      } = req.body;

      const userId = req.user.id;

      // Validate input
      if (!title || title.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Title is required and must be at least 3 characters long'
        });
      }

      // Validate service
      const validServices = ['openai', 'gemini', 'claude'];
      if (!validServices.includes(service)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid AI service specified'
        });
      }

      // Generate content
      const generationResult = await AIService.generateContent({
        title,
        keywords,
        contentType,
        tone,
        length,
        outline
      }, service);

      // Calculate credits
      const creditsUsed = AIService.calculateCredits(generationResult.wordCount);

      // Save generation to database
      const aiGeneration = new AIGeneration({
        user: userId,
        blog: blogId || null,
        title,
        content: generationResult.content,
        service,
        contentType,
        tone,
        length,
        keywords,
        wordCount: generationResult.wordCount,
        creditsUsed,
        estimatedReadTime: generationResult.estimatedReadTime,
        metadata: {
          outline,
          parameters: { tone, length, contentType }
        }
      });

      await aiGeneration.save();

      // Log generation
      console.log(`AI content generated for user ${userId}: ${title}`);

      return res.status(201).json({
        success: true,
        message: 'Content generated successfully',
        data: {
          id: aiGeneration._id,
          content: generationResult.content,
          service,
          wordCount: generationResult.wordCount,
          estimatedReadTime: generationResult.estimatedReadTime,
          creditsUsed,
          generation: aiGeneration
        }
      });

    } catch (error) {
      console.error('Content generation error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate content',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Generate outline
  static async generateOutline(req, res) {
    try {
      const { title, keywords = [] } = req.body;

      if (!title || title.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      const result = await AIService.generateOutline(title, keywords);

      return res.json({
        success: true,
        message: 'Outline generated successfully',
        data: result
      });

    } catch (error) {
      console.error('Outline generation error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate outline',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Improve existing content
  static async improveContent(req, res) {
    try {
      const { content, improvementType = 'grammar' } = req.body;
      const userId = req.user.id;

      if (!content || content.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Content is required and must be at least 10 characters'
        });
      }

      const result = await AIService.improveContent(content, improvementType);

      // Save improvement record
      const improvementRecord = new AIGeneration({
        user: userId,
        title: `Improved content (${improvementType})`,
        content: result.improvedContent,
        service: 'openai',
        contentType: 'improvement',
        wordCount: result.improvedContent.split(/\s+/).length,
        creditsUsed: AIService.calculateCredits(result.improvedContent.split(/\s+/).length),
        metadata: {
          improvementType,
          originalContentLength: content.length,
          improvementDate: new Date()
        }
      });

      await improvementRecord.save();

      return res.json({
        success: true,
        message: 'Content improved successfully',
        data: result
      });

    } catch (error) {
      console.error('Content improvement error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to improve content',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Analyze content
  static async analyzeContent(req, res) {
    try {
      const { content } = req.body;

      if (!content || content.trim().length < 50) {
        return res.status(400).json({
          success: false,
          message: 'Content is required and must be at least 50 characters for analysis'
        });
      }

      const result = await AIService.analyzeContent(content);

      return res.json({
        success: true,
        message: 'Content analyzed successfully',
        data: result
      });

    } catch (error) {
      console.error('Content analysis error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze content',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user's AI generation history
  static async getGenerations(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, service, contentType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      // Build query
      const query = { user: userId };
      
      if (service) query.service = service;
      if (contentType) query.contentType = contentType;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Sort options
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const generations = await AIGeneration.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .populate('blog', 'title slug')
        .lean();

      const total = await AIGeneration.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      // Get statistics
      const stats = await AIGeneration.getStats(userId);

      return res.json({
        success: true,
        message: 'Generations retrieved successfully',
        data: {
          generations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          },
          stats
        }
      });

    } catch (error) {
      console.error('Get generations error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve generations',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get specific generation by ID
  static async getGeneration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid generation ID'
        });
      }

      const generation = await AIGeneration.findOne({
        _id: id,
        user: userId
      }).populate('blog', 'title slug').lean();

      if (!generation) {
        return res.status(404).json({
          success: false,
          message: 'Generation not found'
        });
      }

      return res.json({
        success: true,
        message: 'Generation retrieved successfully',
        data: generation
      });

    } catch (error) {
      console.error('Get generation error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve generation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update generation
  static async updateGeneration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { title, content, status, metadata } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid generation ID'
        });
      }

      // Find generation
      const generation = await AIGeneration.findOne({
        _id: id,
        user: userId
      });

      if (!generation) {
        return res.status(404).json({
          success: false,
          message: 'Generation not found'
        });
      }

      // Update fields
      if (title !== undefined) generation.title = title;
      if (content !== undefined) generation.content = content;
      if (status !== undefined) generation.status = status;
      if (metadata !== undefined) generation.metadata = metadata;

      await generation.save();

      return res.json({
        success: true,
        message: 'Generation updated successfully',
        data: generation
      });

    } catch (error) {
      console.error('Update generation error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to update generation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete generation
  static async deleteGeneration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid generation ID'
        });
      }

      const generation = await AIGeneration.findOneAndDelete({
        _id: id,
        user: userId
      });

      if (!generation) {
        return res.status(404).json({
          success: false,
          message: 'Generation not found'
        });
      }

      return res.json({
        success: true,
        message: 'Generation deleted successfully'
      });

    } catch (error) {
      console.error('Delete generation error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to delete generation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get AI usage statistics
  static async getUsageStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await AIGeneration.getStats(userId);
      const totalCredits = await AIGeneration.getTotalCreditsUsed(userId);

      return res.json({
        success: true,
        message: 'Usage stats retrieved successfully',
        data: {
          ...stats,
          totalCredits
        }
      });

    } catch (error) {
      console.error('Get usage stats error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve usage statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Test AI service connectivity
  static async testAIConnection(req, res) {
    try {
      const { service = 'openai' } = req.query;
      
      // Simple test prompt
      const testPrompt = "Say 'Hello, AI service is working!'";
      let testResponse = '';

      switch(service) {
        case 'openai':
          const openaiCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 10
          });
          testResponse = openaiCompletion.choices[0].message.content;
          break;

        case 'gemini':
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const geminiResult = await model.generateContent(testPrompt);
          testResponse = geminiResult.response.text();
          break;

        case 'claude':
          const claudeMessage = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 10,
            messages: [{ role: "user", content: testPrompt }]
          });
          testResponse = claudeMessage.content[0].text;
          break;

        default:
          throw new Error('Unsupported service');
      }

      return res.json({
        success: true,
        message: `AI service (${service}) is connected`,
        data: {
          service,
          response: testResponse,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('AI connection test error:', error);
      
      return res.status(500).json({
        success: false,
        message: `AI service connection test failed: ${error.message}`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get available AI services
  static async getAvailableServices(req, res) {
    try {
      const services = [
        {
          id: 'openai',
          name: 'OpenAI GPT',
          models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
          status: process.env.OPENAI_API_KEY ? 'available' : 'unavailable',
          maxTokens: 4096,
          supports: ['text', 'chat', 'completion']
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          models: ['gemini-pro', 'gemini-ultra'],
          status: process.env.GOOGLE_AI_API_KEY ? 'available' : 'unavailable',
          maxTokens: 8192,
          supports: ['text', 'multimodal']
        },
        {
          id: 'claude',
          name: 'Anthropic Claude',
          models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
          status: process.env.ANTHROPIC_API_KEY ? 'available' : 'unavailable',
          maxTokens: 4096,
          supports: ['text', 'conversation']
        }
      ];

      return res.json({
        success: true,
        message: 'Available AI services retrieved',
        data: services
      });

    } catch (error) {
      console.error('Get services error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve AI services',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default AIController;