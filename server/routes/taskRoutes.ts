import { Router } from 'express';
import { listTasksByProject, createTask, updateTask, deleteTask } from '../controllers/taskController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireProjectMember } from '../middleware/roles.js';

const router = Router();

// Retrieve tasks by project
router.get('/project/:id', authenticateToken as any, requireProjectMember as any, listTasksByProject as any);

// Create, edit and delete tasks (the controllers verify specific project admin permissions themselves)
router.post('/', authenticateToken as any, createTask as any);
router.put('/:id', authenticateToken as any, updateTask as any);
router.delete('/:id', authenticateToken as any, deleteTask as any);

export default router;
