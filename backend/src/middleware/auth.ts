import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_sign_key_prs_saas';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string | null;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token missing or invalid', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId
    };

    // Auto-propagate tenant ID from JWT if present
    if (decoded.tenantId) {
      req.tenantId = decoded.tenantId;
    }

    next();
  } catch (err) {
    return next(new AppError('Authentication token expired or invalid', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User authentication context not found', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Unauthorized: Insufficient permissions', 403));
    }

    next();
  };
};
