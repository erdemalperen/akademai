import express from 'express';
import { logController } from '../controllers/logController';
import { UserRole } from '../../types';
import { authenticate, authorize } from '../middleware/authMiddleware';
const router = express.Router();
router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN_SENIOR, UserRole.ADMIN_JUNIOR]),
  logController.getLogs
);
router.get(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN_SENIOR, UserRole.ADMIN_JUNIOR]),
  logController.getLogDetails
);
export default router;
