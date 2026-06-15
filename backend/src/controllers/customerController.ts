import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional()
});

// 1. Get Store Customers (TenantAdmin Only)
export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { orders: true }
        }
      }
    });

    res.json(customers);
  } catch (error) {
    next(error);
  }
};

// 2. Get Customer Details (TenantAdmin or the Customer themselves)
export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (userRole === 'Customer' && userId !== id) {
      return next(new AppError('Unauthorized access to profile', 403));
    }

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        addresses: true,
        orders: {
          orderBy: { orderDate: 'desc' },
          include: { payments: true }
        }
      }
    });

    if (!customer) {
      return next(new AppError('Customer profile not found', 404));
    }

    // Exclude password hash from response
    const { passwordHash, ...safeCustomer } = customer;
    res.json(safeCustomer);
  } catch (error) {
    next(error);
  }
};

// 3. Update Customer Profile
export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (userRole === 'Customer' && userId !== id) {
      return next(new AppError('Unauthorized profile update', 403));
    }

    const body = updateCustomerSchema.parse(req.body);

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId }
    });

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: body,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
