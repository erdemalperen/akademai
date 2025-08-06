import express from 'express';
import { UserRole } from '../../types';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { getAverageTrainingCompletionTime } from '../services/statisticsService';
import { statisticsController } from '../controllers/statisticsController';
const router = express.Router();
router.get(
  '/monthly-completed-trainings',
  authenticate,
  statisticsController.getMonthlyCompletedTrainings
);
router.get(
  '/all-completed-trainings',
  authenticate,
  statisticsController.getAllCompletedTrainings
);
router.get(
  '/user-training-progress',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  statisticsController.getUserTrainingProgressReport
);
router.get(
  '/training-progress/:trainingId',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  statisticsController.getTrainingProgressByTrainingId
);
router.get(
  '/trainings-progress',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  statisticsController.getAllTrainingsProgress
);
router.get(
  '/user-conference-trainings/:userId',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR, UserRole.EMPLOYEE]),
  statisticsController.getUserConferenceTrainings
);
router.get(
  '/average-completion-time',
  authenticate,
  authorize([UserRole.ADMIN_JUNIOR, UserRole.ADMIN_SENIOR]),
  async (req, res) => {
    try {
      console.log('[statisticsRoutes] /average-completion-time endpoint çağrıldı.');
      const result = await getAverageTrainingCompletionTime();
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('[statisticsRoutes] /average-completion-time endpoint hatası:', error);
      res.status(500).json({ success: false, message: 'Ortalama tamamlama süresi alınırken bir hata oluştu.' });
    }
  }
);
export default router; 