import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../utils/dbHelper.js';

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-super-secret-key-2026';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required' });
    return;
  }

  try {
    const existingUser = await db.users.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'A user with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role === 'admin' ? 'admin' : 'member';

    const user = await db.users.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    });

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const user = await db.users.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const user = await db.users.findById(req.user._id);
    if (!user) {
      res.status(444).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
    });
  } catch (err) {
    res.status(500).json({ message: 'Fetching profile failed', error: err });
  }
};

export const updateProfile = async (req: any, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { name, avatar } = req.body;

  try {
    const updatedUser = await db.users.updateProfile(req.user._id, { name, avatar });
    if (!updatedUser) {
      res.status(444).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar
    });
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed', error: err });
  }
};
