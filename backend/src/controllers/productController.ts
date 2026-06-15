import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { logAuditAction } from '../utils/auditLogger';

// Validation Schemas
const productQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  maxPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  sku: z.string().min(2),
  basePrice: z.number().positive(),
  stockQuantity: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  categoryId: z.string().uuid(),
  images: z.array(z.object({
    imageUrl: z.string().url(),
    isPrimary: z.boolean().optional().default(false)
  })).optional().default([]),
  variants: z.array(z.object({
    name: z.string().min(1),
    sku: z.string().min(2),
    priceDifference: z.number().default(0),
    stockQuantity: z.number().int().nonnegative().default(0)
  })).optional().default([])
});

const updateProductSchema = createProductSchema.partial();

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional()
});

// CATEGORY CONTROLLERS
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const categories = await prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { name, slug, description } = categorySchema.parse(req.body);

    const existing = await prisma.category.findFirst({
      where: { tenantId, slug: slug.toLowerCase() }
    });

    if (existing) {
      return next(new AppError('Category slug already exists for this tenant', 400));
    }

    const category = await prisma.category.create({
      data: {
        tenantId,
        name,
        slug: slug.toLowerCase(),
        description
      }
    });

    await logAuditAction({
      tenantId,
      userId: req.user?.id,
      action: 'CATEGORY_CREATED',
      entityName: 'Category',
      entityId: category.id
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { name, slug, description } = categorySchema.parse(req.body);

    const category = await prisma.category.findFirst({
      where: { id, tenantId }
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug: slug.toLowerCase(),
        description
      }
    });

    await logAuditAction({
      tenantId,
      userId: req.user?.id,
      action: 'CATEGORY_UPDATED',
      entityName: 'Category',
      entityId: id
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: { id, tenantId }
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    await prisma.category.delete({
      where: { id }
    });

    await logAuditAction({
      tenantId,
      userId: req.user?.id,
      action: 'CATEGORY_DELETED',
      entityName: 'Category',
      entityId: id
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// PRODUCT CONTROLLERS
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { page, limit, search, categoryId, minPrice, maxPrice, sortBy, sortOrder } = productQuerySchema.parse(req.query);

    const whereClause: any = {
      tenantId,
      isActive: true
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.basePrice = {};
      if (minPrice !== undefined) whereClause.basePrice.gte = minPrice;
      if (maxPrice !== undefined) whereClause.basePrice.lte = maxPrice;
    }

    const total = await prisma.product.count({ where: whereClause });
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true, slug: true } },
        images: true,
        variants: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    });

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        images: true,
        variants: true
      }
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const body = createProductSchema.parse(req.body);

    // Verify sku uniqueness
    const existing = await prisma.product.findFirst({
      where: { tenantId, sku: body.sku }
    });

    if (existing) {
      return next(new AppError('SKU code must be unique', 400));
    }

    // Verify category belongs to tenant
    const category = await prisma.category.findFirst({
      where: { id: body.categoryId, tenantId }
    });

    if (!category) {
      return next(new AppError('Invalid category ID', 400));
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          tenantId,
          categoryId: body.categoryId,
          name: body.name,
          description: body.description,
          sku: body.sku,
          basePrice: body.basePrice,
          stockQuantity: body.stockQuantity,
          lowStockThreshold: body.lowStockThreshold
        }
      });

      if (body.images.length > 0) {
        await tx.productImage.createMany({
          data: body.images.map((img) => ({
            tenantId,
            productId: p.id,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary
          }))
        });
      }

      if (body.variants.length > 0) {
        await tx.productVariant.createMany({
          data: body.variants.map((v) => ({
            tenantId,
            productId: p.id,
            name: v.name,
            sku: v.sku,
            priceDifference: v.priceDifference,
            stockQuantity: v.stockQuantity
          }))
        });
      }

      return p;
    });

    await logAuditAction({
      tenantId,
      userId: req.user?.id,
      action: 'PRODUCT_CREATED',
      entityName: 'Product',
      entityId: product.id
    });

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: { images: true, variants: true }
    });

    res.status(201).json(fullProduct);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const body = updateProductSchema.parse(req.body);

    const product = await prisma.product.findFirst({
      where: { id, tenantId }
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (body.sku) {
      const existingSku = await prisma.product.findFirst({
        where: {
          tenantId,
          sku: body.sku,
          id: { not: id }
        }
      });
      if (existingSku) {
        return next(new AppError('SKU code must be unique', 400));
      }
    }

    if (body.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: body.categoryId, tenantId }
      });
      if (!category) {
        return next(new AppError('Invalid category ID', 400));
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          categoryId: body.categoryId,
          name: body.name,
          description: body.description,
          sku: body.sku,
          basePrice: body.basePrice,
          stockQuantity: body.stockQuantity,
          lowStockThreshold: body.lowStockThreshold
        }
      });

      // Simple sync strategies: overwrite and recreate images/variants if provided
      if (body.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (body.images.length > 0) {
          await tx.productImage.createMany({
            data: body.images.map((img) => ({
              tenantId,
              productId: id,
              imageUrl: img.imageUrl,
              isPrimary: img.isPrimary
            }))
          });
        }
      }

      if (body.variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (body.variants.length > 0) {
          await tx.productVariant.createMany({
            data: body.variants.map((v) => ({
              tenantId,
              productId: id,
              name: v.name,
              sku: v.sku,
              priceDifference: v.priceDifference,
              stockQuantity: v.stockQuantity
            }))
          });
        }
      }
    });

    await logAuditAction({
      tenantId,
      userId: req.user?.id,
      action: 'PRODUCT_UPDATED',
      entityName: 'Product',
      entityId: id
    });

    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true }
    });

    res.json(fullProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, tenantId }
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    await prisma.product.delete({
      where: { id }
    });

    await logAuditAction({
      tenantId,
      userId: req.user?.id,
      action: 'PRODUCT_DELETED',
      entityName: 'Product',
      entityId: id
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
