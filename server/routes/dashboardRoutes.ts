import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticateToken as any, getDashboardStats as any);

export default router;
