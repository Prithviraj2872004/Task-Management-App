import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { db } from '../utils/dbHelper.js';

// Verifies if user has general access or specific roles
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access forbidden: Admin permissions required' });
    return;
  }

  next();
};

// Verifies if the authenticated user is the Admin of the specific project
export const requireProjectAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const projectId = req.params.id || req.body.project || req.body.projectId;

  if (!projectId) {
    res.status(400).json({ message: 'Project identification is required' });
    return;
  }

  try {
    const project = await db.projects.findById(projectId);
    if (!project) {
      res.status(444).json({ message: 'Project not found' });
      return;
    }

    const adminId = typeof project.admin === 'object' ? project.admin._id.toString() : project.admin.toString();
    const userId = req.user._id.toString();

    // User is the project admin, or globally an Admin
    if (adminId === userId || req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access forbidden: Only project Admins can perform this action' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Role authorization check error', error: err });
  }
};

// Verifies if the authenticated user belongs to the project (either as admin or member)
export const requireProjectMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const projectId = req.params.id || req.body.project || req.body.projectId || req.query.projectId;

  if (!projectId) {
    res.status(400).json({ message: 'Project identification is required' });
    return;
  }

  try {
    const project = await db.projects.findById(projectId);
    if (!project) {
      res.status(444).json({ message: 'Project not found' });
      return;
    }

    const adminId = typeof project.admin === 'object' ? project.admin._id.toString() : project.admin.toString();
    const memberIds = project.members.map((m: any) => typeof m === 'object' ? m._id.toString() : m.toString());
    const userId = req.user._id.toString();

    const isMember = memberIds.includes(userId);
    const isAdmin = adminId === userId;

    if (isMember || isAdmin || req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access forbidden: You are not a member of this project' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Role verification error', error: err });
  }
};
