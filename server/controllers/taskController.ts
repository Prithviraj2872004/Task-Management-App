import { Response } from 'express';
import { db } from '../utils/dbHelper.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listTasksByProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params; // projectId

  try {
    const tasks = await db.tasks.findForProject(id);
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error listing tasks for this project', error: err });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { title, description, dueDate, priority, status, assignedTo, project } = req.body;

  if (!title || !project || !dueDate) {
    res.status(400).json({ message: 'Title, project reference, and due date are required' });
    return;
  }

  try {
    const targetProject = await db.projects.findById(project);
    if (!targetProject) {
      res.status(444).json({ message: 'Target project not found' });
      return;
    }

    // Verify creator is Project Admin (or global admin)
    const adminId = typeof targetProject.admin === 'object' ? targetProject.admin._id.toString() : targetProject.admin.toString();
    if (adminId !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ message: 'Access forbidden: Only project Admins can create tasks' });
      return;
    }

    const task = await db.tasks.create({
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      status: status || 'todo',
      assignedTo: assignedTo || undefined,
      project,
      createdBy: req.user._id
    });

    // Log Activity
    await db.activities.create(
      `Created task "${title}" in project "${targetProject.title}"`,
      req.user._id,
      project,
      task._id
    );

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error creating task', error: err });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params; // taskId

  try {
    const task = await db.tasks.findById(id);
    if (!task) {
      res.status(444).json({ message: 'Task not found' });
      return;
    }

    const currentProjectId = typeof task.project === 'object' ? task.project._id.toString() : task.project.toString();
    const targetProject = await db.projects.findById(currentProjectId);
    if (!targetProject) {
      res.status(444).json({ message: 'Associated project not found' });
      return;
    }

    const adminId = typeof targetProject.admin === 'object' ? targetProject.admin._id.toString() : targetProject.admin.toString();
    const userId = req.user._id.toString();

    const isProjectAdmin = adminId === userId || req.user.role === 'admin';

    if (isProjectAdmin) {
      // Modify everything
      const { title, description, dueDate, priority, status, assignedTo } = req.body;
      const patchData: any = {};
      if (title !== undefined) patchData.title = title;
      if (description !== undefined) patchData.description = description;
      if (dueDate !== undefined) patchData.dueDate = new Date(dueDate);
      if (priority !== undefined) patchData.priority = priority;
      if (status !== undefined) patchData.status = status;
      // Handle key updates
      if (assignedTo !== undefined) patchData.assignedTo = assignedTo || null;

      const updated = await db.tasks.update(id, patchData);

      // Log Activity
      await db.activities.create(
        `Updated task "${updated.title}"`,
        req.user._id,
        currentProjectId,
        id
      );

      res.status(200).json(updated);
    } else {
      // It's a project member. Check if they are part of the project.
      const memberIds = targetProject.members.map((m: any) => typeof m === 'object' ? m._id.toString() : m.toString());
      if (!memberIds.includes(userId)) {
        res.status(403).json({ message: 'Access forbidden: You are not a member of this project' });
        return;
      }

      // Member can update status ONLY
      const { status } = req.body;
      
      // Look for keys that are NOT status
      const keys = Object.keys(req.body);
      const invalidKeys = keys.filter(k => k !== 'status');

      if (invalidKeys.length > 0) {
        res.status(403).json({ message: 'Access forbidden: Project members can only update task status' });
        return;
      }

      if (!status) {
        res.status(400).json({ message: 'Status must be supplied to update status' });
        return;
      }

      const updated = await db.tasks.update(id, { status });

      // Log Activity
      await db.activities.create(
        `Updated status of task "${updated.title}" to "${status}"`,
        req.user._id,
        currentProjectId,
        id
      );

      res.status(200).json(updated);
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating task', error: err });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  try {
    const task = await db.tasks.findById(id);
    if (!task) {
      res.status(444).json({ message: 'Task not found' });
      return;
    }

    const currentProjectId = typeof task.project === 'object' ? task.project._id.toString() : task.project.toString();
    const targetProject = await db.projects.findById(currentProjectId);
    if (!targetProject) {
      res.status(444).json({ message: 'Associated project not found' });
      return;
    }

    const adminId = typeof targetProject.admin === 'object' ? targetProject.admin._id.toString() : targetProject.admin.toString();
    if (adminId !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ message: 'Access forbidden: Only project Admins can delete tasks' });
      return;
    }

    await db.tasks.delete(id);

    // Log Activity
    await db.activities.create(
      `Deleted task "${task.title}"`,
      req.user._id,
      currentProjectId
    );

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting task', error: err });
  }
};
