import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    const result = await query('SELECT id, email, name, roles FROM users WHERE id = $1', [payload.userId]);
    if (!result.rows[0]) { res.status(401).json({ error: 'User not found' }); return; }
    req.user = result.rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
      const result = await query('SELECT id, email, name, roles FROM users WHERE id = $1', [payload.userId]);
      if (result.rows[0]) req.user = result.rows[0];
    } catch { /* ignore */ }
  }
  next();
};

export const requireRole = (role: string) => (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.roles.includes(role) && !req.user?.roles.includes('admin')) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }
  next();
};
