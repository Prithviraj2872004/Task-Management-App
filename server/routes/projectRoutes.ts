import { Router } from 'express';
import { listProjects, createProject, getProjectDetails, updateProject, deleteProject, addMember, removeMember } from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireProjectAdmin, requireProjectMember } from '../middleware/roles.js';

const router = Router();

// Retrieve user projects & create a project
router.get('/', authenticateToken as any, listProjects as any);
router.post('/', authenticateToken as any, createProject as any);

// Project configurations - Member verification to view details
router.get('/:id', authenticateToken as any, requireProjectMember as any, getProjectDetails as any);

// Modification of projects, adding members, and deleting projects (Admin locks)
router.put('/:id', authenticateToken as any, requireProjectAdmin as any, updateProject as any);
router.delete('/:id', authenticateToken as any, requireProjectAdmin as any, deleteProject as any);

router.post('/:id/add-member', authenticateToken as any, requireProjectAdmin as any, addMember as any);
router.delete('/:id/remove-member', authenticateToken as any, requireProjectAdmin as any, removeMember as any);

export default router;
