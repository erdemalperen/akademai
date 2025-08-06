import express from 'express';
import { UserRole } from '../../types';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  getAllConferencesHandler,
  getConferenceByIdHandler,
  createConferenceHandler,
  updateConferenceHandler,
  deleteConferenceHandler,
  addAttendeeHandler,
  removeAttendeeHandler,
  markAttendanceHandler,
  getConferenceStatsHandler,
  getUserConferencesHandler,
  addConferenceMaterialHandler,
  removeConferenceMaterialHandler
} from '../controllers/conferenceController';
const router = express.Router();
router.get(
  '/assigned',
  authenticate,
  getUserConferencesHandler
);
router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  getAllConferencesHandler
);
router.post(
  '/',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  createConferenceHandler
);
router.get(
  '/:conferenceId',
  authenticate,
  getConferenceByIdHandler
);
router.put(
  '/:conferenceId',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  updateConferenceHandler
);
router.delete(
  '/:conferenceId',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  deleteConferenceHandler
);
router.get(
  '/:conferenceId/stats',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  getConferenceStatsHandler
);
router.post(
  '/:conferenceId/attendees',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  addAttendeeHandler
);
router.delete(
  '/:conferenceId/attendees/:userId',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  removeAttendeeHandler
);
router.put(
  '/:conferenceId/attendees/:userId',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  markAttendanceHandler
);
router.post(
  '/:conferenceId/materials',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  addConferenceMaterialHandler
);
router.delete(
  '/:conferenceId/materials/:materialId',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  removeConferenceMaterialHandler
);
export default router;
