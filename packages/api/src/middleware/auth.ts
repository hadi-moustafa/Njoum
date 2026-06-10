// ============================================================
// Auth middleware — verifies Supabase-issued JWTs
//
// Uses supabaseAdmin.auth.getUser(token) instead of jwt.verify()
// because newer Supabase projects sign tokens with ES256 (ECDSA),
// not HS256. Supabase's own service handles either algorithm.
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@njoum/shared';
import { AppError } from './errorHandler';
import { supabaseAdmin } from '../models/supabase';

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
 * Verifies the Supabase JWT by calling the Supabase Auth API.
 * Works for both HS256 (old projects) and ES256 (new projects).
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header.'));
  }

  const token = header.slice(7);

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return next(new AppError(401, 'TOKEN_INVALID', 'Access token is invalid or expired.'));
    }

    // Role stored in app_metadata by the role-sync trigger
    const role = ((user.app_metadata as any)?.role ?? 'girl') as UserRole;

    req.user = { id: user.id, email: user.email!, role };
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
