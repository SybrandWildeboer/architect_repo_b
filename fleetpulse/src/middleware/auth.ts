import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || (req.query.token as string);
  if (!token) {
    return res.status(401).json({ error: 'missing token' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    (req as any).user = payload;
    next();
  } catch (e) {
    console.log('auth fail', e);
    return res.status(401).json({ error: 'invalid token' });
  }
}

export function adminOnlyByHeader(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-admin'] === 'true') {
    return next();
  }
  return res.status(403).json({ error: 'admin only' });
}
