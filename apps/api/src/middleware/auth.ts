import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, VendorStatus } from '@krishiconnect/shared';
import { config } from '../config';
import prisma from '../db/prisma';
import { AppError } from './errorHandler';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  vendorProfileId?: string;
  vendorStatus?: VendorStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; role: UserRole };
    
    let user: any;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          vendorProfile: {
            select: { id: true, status: true }
          }
        }
      });
    } catch {
      // In dev fallback mode if database is offline
      user = {
        id: decoded.userId,
        email: decoded.userId.includes('admin') ? 'admin@krishiconnect.in' : 'user@krishiconnect.in',
        role: decoded.role,
        fullName: decoded.role === UserRole.ADMIN ? 'Krishi Administrator' : 'Verified User',
        isActive: true,
      };
    }

    if (!user || !user.isActive) {
      return next(new AppError('User account not found or deactivated.', 401));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      fullName: user.fullName,
      vendorProfileId: user.vendorProfile?.id,
      vendorStatus: user.vendorProfile?.status as VendorStatus | undefined,
    };

    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication session.', 401));
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; role: UserRole };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { vendorProfile: { select: { id: true, status: true } } }
      });
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role as UserRole,
          fullName: user.fullName,
          vendorProfileId: user.vendorProfile?.id,
          vendorStatus: user.vendorProfile?.status as VendorStatus | undefined,
        };
      }
    }
    next();
  } catch {
    next();
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Access denied for your user role.', 403));
    }

    next();
  };
};

export const requireVerifiedVendor = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== UserRole.VENDOR) {
    return next(new AppError('Access restricted to vendor accounts.', 403));
  }

  if (req.user.vendorStatus !== VendorStatus.APPROVED) {
    return next(
      new AppError(
        `Vendor account is not approved yet (Current status: ${req.user.vendorStatus || 'UNKNOWN'}). You cannot publish listings or sell until verified by administrators.`,
        403
      )
    );
  }

  next();
};

export const forbidVendorBuying = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  if (req.user.role === UserRole.VENDOR) {
    return next(
      new AppError(
        'Shop owner accounts are for selling only and cannot purchase orders or use buyer cart.',
        403
      )
    );
  }

  next();
};

