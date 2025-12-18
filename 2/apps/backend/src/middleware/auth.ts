import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppDataSource } from '../data-source';
import { TokenBlacklist } from '../entities/TokenBlacklist';

export interface JwtPayload {
  sub: number;
  username: string;
  role: 'super_admin' | 'department_admin' | 'teacher' | 'student';
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = payload as any;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export async function checkBlacklist(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  const repo = AppDataSource.getRepository(TokenBlacklist);
  const found = await repo.findOne({ where: { token } });
  if (found) return res.status(401).json({ message: 'Token revoked' });
  next();
}

export function requireRole(roles: JwtPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload | undefined;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

