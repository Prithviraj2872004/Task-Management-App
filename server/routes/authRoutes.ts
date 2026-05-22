import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken as any, getProfile as any);
router.put('/profile', authenticateToken as any, updateProfile as any);

export default router;
