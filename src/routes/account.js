import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getAccountBalance,
  getAccountDetails,
  updateAccountStatus
} from '../controllers/accountController.js';
import {
  getTransactions,
  getTransactionById,
  getTransactionStats,
  transferFunds
} from '../controllers/transactionController.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Account routes
router.get('/balance', getAccountBalance);
router.get('/details', getAccountDetails);
router.patch('/status', updateAccountStatus);

// Transaction routes
router.get('/transactions', getTransactions);
router.get('/transactions/stats', getTransactionStats);
router.get('/transactions/:id', getTransactionById);
router.post('/transfer', transferFunds);

export default router;