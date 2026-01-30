import Joi from 'joi';

export const generateContentSchema = Joi.object({
  title: Joi.string().min(3).max(200).required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  keywords: Joi.array().items(Joi.string().min(1).max(50)).max(10)
    .messages({
      'array.max': 'Maximum 10 keywords allowed',
      'string.min': 'Keyword must be at least 1 character',
      'string.max': 'Keyword cannot exceed 50 characters'
    }),
  contentType: Joi.string().valid(
    'blog_post', 'article', 'social_media', 
    'meta_description', 'email_newsletter'
  ).default('blog_post'),
  tone: Joi.string().valid(
    'professional', 'conversational', 'authoritative', 
    'friendly', 'technical'
  ).default('professional'),
  length: Joi.string().valid(
    'short', 'medium', 'long', 'comprehensive'
  ).default('medium'),
  outline: Joi.string().max(5000)
    .messages({
      'string.max': 'Outline cannot exceed 5000 characters'
    }),
  service: Joi.string().valid('openai', 'gemini', 'claude')
    .default('openai'),
  blogId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid blog ID format'
    })
});

export const improveContentSchema = Joi.object({
  content: Joi.string().min(10).max(10000).required()
    .messages({
      'string.empty': 'Content is required',
      'string.min': 'Content must be at least 10 characters',
      'string.max': 'Content cannot exceed 10,000 characters'
    }),
  improvementType: Joi.string().valid(
    'grammar', 'seo', 'tone', 'brevity', 'expansion'
  ).default('grammar')
});

export const analyzeContentSchema = Joi.object({
  content: Joi.string().min(50).max(20000).required()
    .messages({
      'string.empty': 'Content is required for analysis',
      'string.min': 'Content must be at least 50 characters for analysis',
      'string.max': 'Content cannot exceed 20,000 characters'
    })
});

export const updateGenerationSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  content: Joi.string().max(50000),
  status: Joi.string().valid(
    'generated', 'saved', 'published', 'archived'
  ),
  metadata: Joi.object()
});