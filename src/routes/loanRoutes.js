import express from 'express';
import {
  createLoanApplication,
  getMyLoanApplications,
  getLoanApplication,
  updateLoanApplication,
  deleteLoanApplication,
  getAllLoanApplications,
  updateLoanStatus,
} from '../controllers/loanController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadLoanDocuments, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// User routes
router.use(authenticate);

router.post(
  '/applications',
  uploadLoanDocuments,
  handleUploadError,
  createLoanApplication
);
router.get('/applications', getMyLoanApplications);
router.get('/applications/:id', getLoanApplication);
router.put(
  '/applications/:id',
  uploadLoanDocuments,
  handleUploadError,
  updateLoanApplication
);
router.delete('/applications/:id', deleteLoanApplication);

// Admin/Officer routes
router.get(
  '/admin/applications',
  authorize('admin', 'officer'),
  getAllLoanApplications
);
router.put(
  '/admin/applications/:id/status',
  authorize('admin', 'officer'),
  updateLoanStatus
);

export default router;