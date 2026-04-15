// ============================================================
// Auth middleware — verifies Supabase-issued JWTs
//
// Supabase Auth signs all tokens with SUPABASE_JWT_SECRET.
// The API never issues its own tokens — it only verifies them.
// Custom claims (role, etc.) are synced from the users table
// into the JWT via a Supabase Auth hook or trigger.
// ============================================================
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, ApiResponse } from '@njoum/shared';
import { AppError } from './errorHandler';

// Shape of the decoded Supabase JWT payload
interface SupabaseJwtPayload {
  sub: string;          // user UUID (auth.uid())
  email: string;
  role?: string;        // Supabase role (usually 'authenticated')
  app_metadata?: {
    role?: UserRole;    // our custom role, synced from users table
  };
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  aud: string;
  exp: number;
}

// Extend Express Request to carry the verified user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Verifies the Supabase JWT from the Authorization header
 * and attaches the decoded user to req.user.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header.'));
  }

  const token = header.slice(7);
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    return next(new AppError(500, 'MISCONFIGURED', 'SUPABASE_JWT_SECRET is not set.'));
  }

  try {
    const payload = jwt.verify(token, secret) as SupabaseJwtPayload;

    // Role is stored in app_metadata (set via Supabase Auth admin SDK when user record changes)
    const role = (payload.app_metadata?.role ?? 'girl') as UserRole;

    req.user = { id: payload.sub, email: payload.email, role };
    next();
  } catch {
    next(new AppError(401, 'TOKEN_INVALID', 'Access token is invalid or expired.'));
  }
}

/**
 * Checks that the authenticated user has one of the allowed roles.
 * Always chain after requireAuth.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
    }
    next();
  };
}

// Shorthand helpers
export const requireAdmin      = requireRole('super_admin', 'content_admin', 'community_moderator');
export const requireSuperAdmin = requireRole('super_admin');
