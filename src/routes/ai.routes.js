import express from 'express';
import { AIController } from '../controllers/AI.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { 
  generateContentSchema,
  improveContentSchema,
  analyzeContentSchema,
  updateGenerationSchema 
} from '../middleware/ai.validator.js';

const router = express.Router();

// Apply authentication middleware to all AI routes
router.use(authenticate); // NOT: router.use(authMiddleware);

// Content Generation
router.post(
  '/generate', 
  validate(generateContentSchema),
  AIController.generateContent
);

router.post(
  '/outline',
  validate(generateContentSchema),
  AIController.generateOutline
);

router.post(
  '/improve',
  validate(improveContentSchema),
  AIController.improveContent
);

router.post(
  '/analyze',
  validate(analyzeContentSchema),
  AIController.analyzeContent
);

// Generation Management
router.get('/generations', AIController.getGenerations);
router.get('/generations/:id', AIController.getGeneration);
router.put(
  '/generations/:id',
  validate(updateGenerationSchema),
  AIController.updateGeneration
);
router.delete('/generations/:id', AIController.deleteGeneration);

// Statistics & Monitoring
router.get('/stats/usage', AIController.getUsageStats);
router.get('/stats/services', AIController.getAvailableServices);

// Service Health
router.get('/health', AIController.testAIConnection);

export default router;