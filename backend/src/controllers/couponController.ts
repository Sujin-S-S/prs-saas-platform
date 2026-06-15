import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { logAuditAction } from '../utils/auditLogger';

const couponSchema = z.object({
  code: z.string().min(2).toUpperCase(),
  discountType: z.enum(['Percentage', 'Flat']),
  discountValue: z.number().positive(),
  expiryDate: z.string().transform((v) => new Date(v)),
  minOrderAmount: z.number().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true)
});

export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const coupons = await prisma.coupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const body = couponSchema.parse(req.body);

    const existing = await prisma.coupon.findFirst({
      where: { tenantId, code: body.code }
    });

    if (existing) {
      return next(new AppError('Coupon code already exists', 400));
    }

    const coupon = await prisma.coupon.create({
      data: {
        tenantId,
        code: body.code,
        discountType: body.discountType,
        discountValue: body.discountValue,
        expiryDate: body.expiryDate,
        minOrderAmount: body.minOrderAmount,
        isActive: body.isActive
      }
    });

    await logAuditAction({
      tenantId,
      userId: req.user?.id,
      action: 'COUPON_CREATED',
      entityName: 'Coupon',
      entityId: coupon.id
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { code, amount } = req.body;

    if (!code) {
      return next(new AppError('Coupon code is required', 400));
    }

    const coupon = await prisma.coupon.findFirst({
      where: { tenantId, code: code.toUpperCase() }
    });

    if (!coupon || !coupon.isActive) {
      return next(new AppError('Coupon invalid or inactive', 404));
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return next(new AppError('Coupon has expired', 400));
    }

    if (amount && Number(amount) < Number(coupon.minOrderAmount)) {
      return next(new AppError(`Minimum order amount of $${coupon.minOrderAmount} required`, 400));
    }

    res.json({
      valid: true,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const coupon = await prisma.coupon.findFirst({
      where: { id, tenantId }
    });

    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    await prisma.coupon.delete({
      where: { id }
    });

    await logAuditAction({
      tenantId,
      userId: req.user?.id,
      action: 'COUPON_DELETED',
      entityName: 'Coupon',
      entityId: id
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
