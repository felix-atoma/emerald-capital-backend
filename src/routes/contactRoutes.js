import express from 'express';
import {
  createContactMessage,
  getContactMessages,
  getContactMessage,
  updateContactMessageStatus,
  deleteContactMessage,
} from '../controllers/contactController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createContactMessage);

// Admin routes
router.use(authenticate);
router.use(authorize('admin', 'officer'));

router.get('/', getContactMessages);
router.get('/:id', getContactMessage);
router.put('/:id/status', updateContactMessageStatus);
router.delete('/:id', deleteContactMessage);

export default router;