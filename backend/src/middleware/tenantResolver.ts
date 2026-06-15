import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import prisma from '../config/db';

export const resolveTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Check if X-Tenant-Id header is present
  const headerTenantId = req.headers['x-tenant-id'] as string;
  if (headerTenantId) {
    try {
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { id: headerTenantId },
            { subdomain: headerTenantId.toLowerCase() }
          ]
        },
        select: { id: true, isActive: true }
      });

      if (tenant) {
        if (!tenant.isActive) {
          return next(new AppError('Tenant is deactivated', 403));
        }
        req.tenantId = tenant.id;
        return next();
      }
    } catch (error) {
      return next(error);
    }
  }

  // 2. Check if host has subdomain (excluding standard host like localhost)
  const host = req.headers.host || '';
  const parts = host.split('.');
  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && !parts[0].includes('127.0.0.1')) {
    const subdomain = parts[0];
    
    // Resolve tenant ID from subdomain
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain },
        select: { id: true, isActive: true }
      });

      if (tenant) {
        if (!tenant.isActive) {
          return next(new AppError('Tenant is deactivated', 403));
        }
        req.tenantId = tenant.id;
        return next();
      }
    } catch (error) {
      return next(error);
    }
  }

  next();
};

export const requireTenant = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Ensure tenantId was resolved
  if (!req.tenantId && (!req.user || !req.user.tenantId)) {
    return next(new AppError('Tenant context is required for this resource', 400));
  }

  // If authenticated user is a TenantAdmin, override tenantId with their user tenantId to ensure security
  if (req.user && req.user.role === 'TenantAdmin') {
    if (!req.user.tenantId) {
      return next(new AppError('Tenant Admin has no associated Tenant', 403));
    }
    req.tenantId = req.user.tenantId;
  }

  next();
};
