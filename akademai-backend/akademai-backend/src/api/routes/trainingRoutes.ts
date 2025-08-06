import express from 'express';
import { 
    createTrainingHandler, 
    getAllTrainingsHandler, 
    getTrainingByIdHandler, 
    updateTrainingHandler, 
    deleteTrainingHandler, 
    addTrainingContentHandler, 
    getTrainingContentHandler, 
    updateTrainingContentHandler,
    getTrainingProgressHandler, 
    updateTrainingProgressHandler,
    getQuizzesForTrainingHandler, 
    submitQuizAttemptHandler, 
    getQuizAttemptsForUserHandler, 
    getMyEnrollmentsHandler, 
    assignTrainingHandler,
    unassignTrainingHandler,
    getAssignmentsForTrainingHandler,
    getAssignedTrainingsForUserHandler,
    getAllRelevantTrainingsForUserHandler,
    getQuizStatusForTrainingHandler,
    getPublishedTrainingsHandler
} from '../controllers/trainingController'; 
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload'; 
import { UserRole } from '../../types'; 
const router = express.Router();
router.get(
    '/assigned',
    authenticateToken,
    getAssignedTrainingsForUserHandler 
);
router.get(
    '/published',
    authenticateToken,
    getPublishedTrainingsHandler
);
router.post('/', authenticateToken, createTrainingHandler);
router.get('/', authenticateToken, getAllTrainingsHandler); 
router.get('/:trainingId', authenticateToken, getTrainingByIdHandler);
router.put('/:trainingId', authenticateToken, updateTrainingHandler);
router.delete('/:trainingId', authenticateToken, deleteTrainingHandler);
router.post('/:trainingId/content', authenticateToken, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), addTrainingContentHandler);
router.get('/:trainingId/content', authenticateToken, getTrainingContentHandler);
router.put('/:trainingId/content', authenticateToken, updateTrainingContentHandler);
router.get('/:trainingId/quizzes', authenticateToken, getQuizzesForTrainingHandler);
router.post('/:trainingId/quizzes/:quizId/submit', authenticateToken, submitQuizAttemptHandler);
router.get('/:trainingId/quizzes/:quizId/attempts', authenticateToken, getQuizAttemptsForUserHandler);
router.get('/:trainingId/quiz-status', authenticateToken, getQuizStatusForTrainingHandler);
router.get('/my-enrollments', authenticateToken, getMyEnrollmentsHandler); 
router.get('/:trainingId/progress/:userId', authenticateToken, getTrainingProgressHandler); 
router.put('/:trainingId/progress/:userId', authenticateToken, updateTrainingProgressHandler); 
router.post(
    '/:trainingId/assign',
    authenticateToken, 
    assignTrainingHandler 
);
router.delete(
    '/:trainingId/assign/:userId',
    authenticateToken,
    unassignTrainingHandler
);
router.get(
    '/:trainingId/assignments',
    authenticateToken,
    getAssignmentsForTrainingHandler
);
router.get(
    '/all-relevant',
    authenticateToken, 
    getAllRelevantTrainingsForUserHandler
);
export default router;
