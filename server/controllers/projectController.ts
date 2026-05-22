import { Response } from 'express';
import { db } from '../utils/dbHelper.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const projects = await db.projects.findForUser(req.user._id);
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving projects', error: err });
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { title, description } = req.body;

  if (!title) {
    res.status(400).json({ message: 'Project title is required' });
    return;
  }

  try {
    const project = await db.projects.create({
      title,
      description: description || '',
      admin: req.user._id,
      members: [] // Project creator is Admin, empty members to begin with
    });

    // Log Activity
    await db.activities.create(
      `Created project "${title}"`,
      req.user._id,
      project._id
    );

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Error creating project', error: err });
  }
};

export const getProjectDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const project = await db.projects.findById(id);
    if (!project) {
      res.status(444).json({ message: 'Project not found' });
      return;
    }

    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving project details', error: err });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const updated = await db.projects.update(id, { title, description });
    if (!updated) {
      res.status(444).json({ message: 'Project not found' });
      return;
    }

    // Log Activity
    await db.activities.create(
      `Updated project details for "${updated.title}"`,
      req.user._id,
      id
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating project', error: err });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  try {
    const project = await db.projects.findById(id);
    if (!project) {
      res.status(444).json({ message: 'Project not found' });
      return;
    }

    await db.projects.delete(id);

    // Log Activity
    await db.activities.create(
      `Deleted project "${project.title}"`,
      req.user._id
    );

    res.status(200).json({ message: 'Project and all associated tasks successfully deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting project', error: err });
  }
};

export const addMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params; // projectId
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: 'Member email is required' });
    return;
  }

  try {
    const result = await db.projects.addMember(id, email);
    if (!result) {
      res.status(444).json({ message: 'Project or User not found' });
      return;
    }

    if (result.error) {
      res.status(400).json({ message: result.error });
      return;
    }

    // Log Activity
    await db.activities.create(
      `Added member "${email}" to project "${result.title}"`,
      req.user._id,
      id
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error adding member to project', error: err });
  }
};

export const removeMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params; // projectId
  const { memberId } = req.body;

  if (!memberId) {
    res.status(400).json({ message: 'Member User ID is required' });
    return;
  }

  try {
    const targetUser = await db.users.findById(memberId);
    if (!targetUser) {
      res.status(444).json({ message: 'User to remove not found' });
      return;
    }

    const result = await db.projects.removeMember(id, memberId);
    if (!result) {
      res.status(444).json({ message: 'Project not found' });
      return;
    }

    // Log Activity
    await db.activities.create(
      `Removed member "${targetUser.name}" from project "${result.title}"`,
      req.user._id,
      id
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error removing member from project', error: err });
  }
};
