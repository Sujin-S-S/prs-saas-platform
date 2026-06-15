import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { logAuditAction } from '../utils/auditLogger';

const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional()
});

// 1. Get All Tenants (SuperAdmin Only)
export const getTenants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, orders: true, products: true }
        }
      }
    });

    res.json(tenants);
  } catch (error) {
    next(error);
  }
};

// 2. Update Tenant Status (SuperAdmin Only)
export const updateTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = updateTenantSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!tenant) {
      return next(new AppError('Tenant not found', 404));
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: body
    });

    await logAuditAction({
      userId: req.user?.id,
      action: `TENANT_UPDATED_BY_SUPERADMIN_${id}`,
      entityName: 'Tenant',
      entityId: id
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// 3. SuperAdmin Global Dashboard Stats (SuperAdmin Only)
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalTenants = await prisma.tenant.count();
    const totalOrders = await prisma.order.count();
    
    // Sum total revenue
    const revenueAggregate = await prisma.order.aggregate({
      _sum: {
        totalAmount: true
      },
      where: {
        status: { not: 'Cancelled' }
      }
    });

    const totalRevenue = revenueAggregate._sum.totalAmount || 0;

    // Last 5 registered tenants
    const latestTenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      totalTenants,
      totalOrders,
      totalRevenue: Number(totalRevenue),
      latestTenants
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get System Audit Logs (SuperAdmin Only)
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await prisma.auditLog.count();
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { email: true, role: true } },
        tenant: { select: { name: true } }
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit
    });

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs
    });
  } catch (error) {
    next(error);
  }
};
