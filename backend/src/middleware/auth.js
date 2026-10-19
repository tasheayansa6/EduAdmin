import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { getSessionUser } from '../services/authService.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new AppError(401, 'Sign in to continue.');

    let payload;
    try {
      payload = jwt.verify(match[1], env.jwtSecret);
    } catch {
      throw new AppError(401, 'Your session has expired. Sign in again.');
    }

    const subject = Number(payload.sub);
    if (!Number.isInteger(subject) || subject <= 0) {
      throw new AppError(401, 'Sign in to continue.');
    }

    const user = await getSessionUser(subject);
    if (!user || Number(payload.sv) !== Number(user.sessionVersion)) {
      throw new AppError(401, 'Sign in to continue.');
    }

    if (!['admin', 'super_admin'].includes(user.role)) {
      throw new AppError(403, 'You do not have permission to perform this action.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      next(new AppError(403, 'You do not have permission to perform this action.'));
      return;
    }
    next();
  };
}

export const requireAdmin = [authenticate, authorize('admin', 'super_admin')];
export const requireSuperAdmin = [authenticate, authorize('super_admin')];
