import { Router } from 'express';
import * as userController from '../controllers/userController';
const router = Router();
router.post('/login', userController.loginAdmin);
export default router; 