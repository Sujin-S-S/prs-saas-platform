import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { logAuditAction } from '../utils/auditLogger';

// Validation schemas
const addressSchema = z.object({
  type: z.enum(['Billing', 'Shipping']),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  zipCode: z.string().min(3)
});

const createOrderSchema = z.object({
  items: z.array(z.object({
    productVariantId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1),
  shippingAddress: z.union([z.string().uuid(), addressSchema]),
  billingAddress: z.union([z.string().uuid(), addressSchema]),
  couponCode: z.string().optional(),
  paymentMethod: z.string().min(2)
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])
});

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = { tenantId };

    // Enforce Customer context if the user is a customer
    if (userRole === 'Customer') {
      whereClause.customerId = userId;
    } else if (req.query.customerId) {
      // Admin filtering orders of a specific customer
      whereClause.customerId = req.query.customerId as string;
    }

    if (req.query.status) {
      whereClause.status = req.query.status as string;
    }

    const total = await prisma.order.count({ where: whereClause });
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        items: {
          include: {
            productVariant: {
              include: { product: { select: { name: true } } }
            }
          }
        },
        payments: true
      },
      orderBy: { orderDate: 'desc' },
      skip,
      take: limit
    });

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      orders
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const order = await prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        shippingAddress: true,
        billingAddress: true,
        items: {
          include: {
            productVariant: {
              include: { product: true }
            }
          }
        },
        payments: true
      }
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Customer can only view their own order
    if (userRole === 'Customer' && order.customerId !== userId) {
      return next(new AppError('Unauthorized access to order', 403));
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    // In our JWT setup, Customer requests place customer id on req.user.id
    const customerId = req.user?.id!;
    const body = createOrderSchema.parse(req.body);

    // 1. Calculate pricing and verify stock
    const variantIds = body.items.map(item => item.productVariantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, tenantId },
      include: { product: true }
    });

    if (variants.length !== body.items.length) {
      return next(new AppError('Some items in the cart are invalid or deleted', 400));
    }

    let subtotal = 0;
    const orderItemsData: any[] = [];
    const stockUpdates: { variantId: string; newStock: number; productId: string; newProdStock: number }[] = [];

    for (const item of body.items) {
      const variant = variants.find(v => v.id === item.productVariantId);
      if (!variant) continue;

      if (variant.stockQuantity < item.quantity) {
        return next(new AppError(`Insufficient stock for product ${variant.product.name} (${variant.name})`, 400));
      }

      const unitPrice = Number(variant.product.basePrice) + Number(variant.priceDifference);
      subtotal += unitPrice * item.quantity;

      orderItemsData.push({
        tenantId,
        productVariantId: variant.id,
        quantity: item.quantity,
        unitPrice
      });

      stockUpdates.push({
        variantId: variant.id,
        newStock: variant.stockQuantity - item.quantity,
        productId: variant.productId,
        newProdStock: variant.product.stockQuantity - item.quantity
      });
    }

    // 2. Process Coupon discount
    let totalAmount = subtotal;
    if (body.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { tenantId, code: body.couponCode.toUpperCase(), isActive: true }
      });

      if (!coupon || new Date(coupon.expiryDate) < new Date() || subtotal < Number(coupon.minOrderAmount)) {
        return next(new AppError('Coupon code is invalid or does not meet conditions', 400));
      }

      if (coupon.discountType === 'Percentage') {
        const discount = (subtotal * Number(coupon.discountValue)) / 100;
        totalAmount = Math.max(0, subtotal - discount);
      } else {
        totalAmount = Math.max(0, subtotal - Number(coupon.discountValue));
      }
    }

    // 3. Handle Shipping and Billing Addresses
    const result = await prisma.$transaction(async (tx) => {
      let shippingAddressId: string;
      let billingAddressId: string;

      if (typeof body.shippingAddress === 'string') {
        shippingAddressId = body.shippingAddress;
      } else {
        const addr = await tx.address.create({
          data: { ...body.shippingAddress, tenantId, customerId }
        });
        shippingAddressId = addr.id;
      }

      if (typeof body.billingAddress === 'string') {
        billingAddressId = body.billingAddress;
      } else {
        const addr = await tx.address.create({
          data: { ...body.billingAddress, tenantId, customerId }
        });
        billingAddressId = addr.id;
      }

      // 4. Create Order
      const orderCount = await tx.order.count({ where: { tenantId } });
      const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

      const order = await tx.order.create({
        data: {
          tenantId,
          customerId,
          orderNumber,
          totalAmount,
          status: 'Pending',
          shippingAddressId,
          billingAddressId
        }
      });

      // 5. Create Order Items
      await tx.orderItem.createMany({
        data: orderItemsData.map(item => ({
          ...item,
          orderId: order.id
        }))
      });

      // 6. Update Inventory Stock
      for (const update of stockUpdates) {
        await tx.productVariant.update({
          where: { id: update.variantId },
          data: { stockQuantity: update.newStock }
        });

        await tx.product.update({
          where: { id: update.productId },
          data: { stockQuantity: update.newProdStock }
        });
      }

      // 7. Create Payment Log (Mock integration)
      await tx.payment.create({
        data: {
          tenantId,
          orderId: order.id,
          amount: totalAmount,
          paymentMethod: body.paymentMethod,
          transactionId: `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          status: 'Completed' // Mock immediate completion for testing purposes
        }
      });

      return order;
    });

    await logAuditAction({
      tenantId,
      userId: customerId,
      action: 'ORDER_CREATED',
      entityName: 'Order',
      entityId: result.id
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: { items: true, payments: true }
    });

    res.status(201).json(fullOrder);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { status } = updateOrderStatusSchema.parse(req.body);

    const order = await prisma.order.findFirst({
      where: { id, tenantId }
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status }
    });

    await logAuditAction({
      tenantId,
      userId: req.user?.id,
      action: `ORDER_STATUS_UPDATED_${status.toUpperCase()}`,
      entityName: 'Order',
      entityId: id
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const generateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        shippingAddress: true,
        items: {
          include: {
            productVariant: {
              include: { product: true }
            }
          }
        },
        payments: true
      }
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Return invoice data model
    const invoice = {
      invoiceNumber: `INV-${order.orderNumber.split('-')[1] || Date.now()}`,
      orderNumber: order.orderNumber,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      customerEmail: order.customer.email,
      shippingAddress: `${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country} - ${order.shippingAddress.zipCode}`,
      items: order.items.map((item) => ({
        description: `${item.productVariant.product.name} (${item.productVariant.name})`,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.unitPrice) * item.quantity
      })),
      subtotal: order.items.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0),
      total: Number(order.totalAmount),
      paymentMethod: order.payments[0]?.paymentMethod || 'N/A',
      paymentStatus: order.payments[0]?.status || 'Pending'
    };

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};
