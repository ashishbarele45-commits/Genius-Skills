import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { adminAuth } from './firebaseAdmin';

const SESSION_SECRET = process.env.SESSION_SECRET || 'genius_skills_fallback_secret_key_prod_2026';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(payload: { id: string; email: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${data}`)
    .digest('base64url');
  return `${header}.${data}.${signature}`;
}

export async function verifyTokenOrFirebase(token: string): Promise<AuthUser | null> {
  // First attempt Firebase Admin ID Token verification
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded && decoded.uid) {
      const email = decoded.email || '';
      // Strict admin check: ONLY the exact authorized Firebase UID and verified custom claim admin === true
      // The admin email alone is NOT sufficient without the verified custom claim
      const isAdmin =
        decoded.uid === 'Bj7qBJUBTvY97fQFAn1wpZEATUq2' &&
        (decoded.admin === true || decoded.role === 'ADMIN');

      return {
        id: decoded.uid,
        name: decoded.name || email.split('@')[0] || 'Student',
        email,
        role: isAdmin ? 'ADMIN' : 'STUDENT',
      };
    }
  } catch {
    // If not a Firebase token, try standard HMAC session token
  }

  // Fallback to HMAC token verification
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const [header, data, signature] = parts;
      const expectedSig = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(`${header}.${data}`)
        .digest('base64url');
      if (signature === expectedSig) {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
        if (!payload.exp || payload.exp >= Math.floor(Date.now() / 1000)) {
          return {
            id: payload.id,
            name: payload.name || payload.email?.split('@')[0] || 'User',
            email: payload.email,
            role: payload.role as 'STUDENT' | 'ADMIN',
          };
        }
      }
    }
  } catch {
    // invalid
  }

  return null;
}

export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const authUser = await verifyTokenOrFirebase(token);
      if (authUser) {
        req.user = authUser;
      }
    }
  } catch {
    // optional auth failure does not reject
  }
  next();
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const authUser = await verifyTokenOrFirebase(token);
  if (!authUser) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.user = authUser;
  next();
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden. Administrator privileges required.' });
    }
    next();
  });
}
