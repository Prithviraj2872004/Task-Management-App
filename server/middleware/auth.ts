import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-super-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: 'admin' | 'member';
    name: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authorization token is required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: 'Invalid or expired authorization token' });
      return;
    }
    req.user = decoded as { _id: string; email: string; role: 'admin' | 'member'; name: string };
    next();
  });
};
