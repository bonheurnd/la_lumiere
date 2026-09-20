import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lalumiere-choir-adepr-nyanza-kicukiro-secret-key-2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: { id: string; email: string; role: string; name: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
  } catch (err) {
    return null;
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Ugomba kwinjira muri konti yawe (Authentication required)' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Igihe cyo kwinjira cyarangiye cyangwa umwirondoro si wo (Invalid or expired token)' });
  }

// Verify user still exists in database and is not disabled
  const user = db.prepare('SELECT id, email, role, name, is_disabled FROM users WHERE id = ?').get(decoded.id) as (AuthenticatedUser & { is_disabled?: number }) | undefined;
  if (!user) {
    return res.status(401).json({ error: 'Konti ntikiboneka (User not found)' });
  }

  if (user.is_disabled) {
    return res.status(403).json({ error: 'Konti yawe yahagaritswe n\'ubuyobozi (Account has been disabled by administrator)' });
  }

  req.user = user;
  next();
}

export function isUserAdmin(role?: string): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'content_admin' || role === 'moderator';
}

export function isUserSuperAdmin(role?: string): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function isUserContentAdmin(role?: string): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'content_admin';
}

export function isUserModerator(role?: string): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'content_admin' || role === 'moderator';
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!isUserAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Uburenganzira bw\'umuyobozi burenze ubwawe (Admin privileges required)' });
    }
    next();
  });
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!isUserSuperAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Uburenganzira bw\'umuyobozi mukuru burenze ubwawe (Super Admin privileges required)' });
    }
    next();
  });
}

export function requireContentAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!isUserContentAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Uburenganzira bwo gutunganya ubutumwa burakenewe (Content Admin privileges required)' });
    }
    next();
  });
}

export function requireModerator(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!isUserModerator(req.user?.role)) {
      return res.status(403).json({ error: 'Uburenganzira bwo kugenzura ubutumwa burakenewe (Moderator privileges required)' });
    }
    next();
  });
}
