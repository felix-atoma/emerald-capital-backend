import express from 'express';
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  getSubscriber,
} from '../controllers/newsletterController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes
router.use(authenticate);
router.use(authorize('admin'));

router.get('/subscribers', getSubscribers);
router.get('/subscribers/:id', getSubscriber);

export default router;