import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { UserRole } from '../../types';
import { bootcampService } from '../services/bootcampService';
import {
  getAllBootcampsHandler,
  getBootcampByIdHandler,
  createBootcampHandler,
  updateBootcampHandler,
  deleteBootcampHandler,
  addTrainingToBootcampHandler,
  removeTrainingFromBootcampHandler,
  updateTrainingOrderHandler,
  assignBootcampToUserHandler,
  unassignBootcampFromUserHandler,
  getAssignedBootcampsForUserHandler,
  getAssignedUsersForBootcampHandler,
  updateBootcampProgressHandler,
  completeBootcampHandler,
  assignUserToBootcampHandler,
  removeUserFromBootcampHandler,
  getBootcampParticipantsHandler,
  getAssignedBootcampsHandler
} from '../controllers/bootcampController';
const router = express.Router();
router.get(
  '/assigned',
  authenticateToken,
  getAssignedBootcampsForUserHandler
);
router.get(
  '/assigned/my',
  authenticateToken,
  getAssignedBootcampsHandler
);
router.get(
  '/',
  authenticateToken,
  getAllBootcampsHandler
);
router.post(
  '/',
  authenticateToken,
  createBootcampHandler
);
router.get(
  '/:bootcampId',
  authenticateToken,
  getBootcampByIdHandler
);
router.put(
  '/:bootcampId',
  authenticateToken,
  updateBootcampHandler
);
router.delete(
  '/:bootcampId',
  authenticateToken,
  deleteBootcampHandler
);
router.get(
  '/:bootcampId/trainings',
  authenticateToken,
  async (req, res) => {
    try {
      const { bootcampId } = req.params;
      const trainings = await bootcampService.getBootcampTrainings(bootcampId);
      res.json({ success: true, data: trainings });
    } catch (error) {
      console.error('Bootcamp eğitimleri getirilirken hata:', error);
      res.status(500).json({ success: false, message: 'Bootcamp eğitimleri getirilirken bir hata oluştu.' });
    }
  }
);
router.put(
  '/:bootcampId/trainings',
  authenticateToken,
  async (req, res) => {
    try {
      const { bootcampId } = req.params;
      const { trainingIds } = req.body;
      if (!Array.isArray(trainingIds)) {
        return res.status(400).json({ success: false, message: 'trainingIds bir dizi olmalıdır' });
      }
      await bootcampService.updateBootcampTrainings(bootcampId, trainingIds);
      res.json({ 
        success: true, 
        message: 'Bootcamp eğitimleri başarıyla güncellendi',
        data: {
          bootcampId,
          trainings: trainingIds
        }
      });
    } catch (error) {
      console.error('Bootcamp eğitimleri güncellenirken hata:', error);
      res.status(500).json({ success: false, message: 'Bootcamp eğitimleri güncellenirken bir hata oluştu.' });
    }
  }
);
router.post(
  '/:bootcampId/trainings',
  authenticateToken,
  addTrainingToBootcampHandler
);
router.delete(
  '/:bootcampId/trainings/:trainingId',
  authenticateToken,
  removeTrainingFromBootcampHandler
);
router.put(
  '/:bootcampId/trainings/:trainingId/order',
  authenticateToken,
  updateTrainingOrderHandler
);
router.post(
  '/:bootcampId/assign',
  authenticateToken,
  assignBootcampToUserHandler
);
router.delete(
  '/:bootcampId/assign/:userId',
  authenticateToken,
  unassignBootcampFromUserHandler
);
router.get(
  '/:bootcampId/assignments',
  authenticateToken,
  getAssignedUsersForBootcampHandler
);
router.get(
  '/:bootcampId/participants',
  authenticateToken,
  getBootcampParticipantsHandler
);
router.post(
  '/:bootcampId/participants',
  authenticateToken,
  assignUserToBootcampHandler
);
router.delete(
  '/:bootcampId/participants/:userId',
  authenticateToken,
  removeUserFromBootcampHandler
);
router.put(
  '/:bootcampId/progress',
  authenticateToken,
  updateBootcampProgressHandler
);
router.put(
  '/:bootcampId/complete',
  authenticateToken,
  completeBootcampHandler
);
export default router;
