import express from 'express';
import { 
  getAIRecommendation, 
  getQuickReplies, 
  getAvailableTrainings 
} from '../controllers/aiAssistantController';
import { authenticateToken } from '../middleware/authMiddleware';
const router = express.Router();
router.post('/recommendation', authenticateToken, getAIRecommendation);
router.get('/quick-replies', authenticateToken, getQuickReplies);
router.get('/trainings', authenticateToken, getAvailableTrainings);
export default router;