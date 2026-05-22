import { Response } from 'express';
import { db } from '../utils/dbHelper.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const userId = req.user._id.toString();

  try {
    const stats = await db.tasks.getUserStats(userId);
    const activities = await db.activities.findForUser(userId);

    res.status(200).json({
      stats,
      activities
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving dashboard analytics', error: err });
  }
};
