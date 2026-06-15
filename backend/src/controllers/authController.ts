import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { logAuditAction } from '../utils/auditLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_sign_key_prs_saas';
const JWT_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Validations
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerTenantSchema = z.object({
  tenantName: z.string().min(2),
  subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
});

const customerRegisterSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional()
});

const tokenRefreshSchema = z.object({
  refreshToken: z.string()
});

// Helper: Generate Tokens
const generateTokens = (user: { id: string; email: string; role: string; tenantId?: string | null }) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
  );
  return { accessToken, refreshToken };
};

// 1. SuperAdmin & TenantAdmin Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (!user.isActive) {
      return next(new AppError('User account is deactivated', 403));
    }

    if (user.tenantId && !user.tenant?.isActive) {
      return next(new AppError('Tenant is deactivated', 403));
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpiryTime: expiryDate
      }
    });

    await logAuditAction({
      userId: user.id,
      tenantId: user.tenantId,
      action: 'USER_LOGIN',
      entityName: 'User',
      entityId: user.id
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Create Tenant (Create Tenant + Admin User in 1 transaction)
export const registerTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerTenantSchema.parse(req.body);

    // Check subdomain uniqueness
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: body.subdomain.toLowerCase() }
    });
    if (existingTenant) {
      return next(new AppError('Subdomain is already taken', 400));
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    });
    if (existingUser) {
      return next(new AppError('Email address is already in use', 400));
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: body.tenantName,
          subdomain: body.subdomain.toLowerCase(),
          isActive: true
        }
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: body.email,
          passwordHash,
          role: 'TenantAdmin',
          firstName: body.firstName,
          lastName: body.lastName,
          isActive: true
        }
      });

      return { tenant, user };
    });

    await logAuditAction({
      tenantId: result.tenant.id,
      userId: result.user.id,
      action: 'TENANT_REGISTERED',
      entityName: 'Tenant',
      entityId: result.tenant.id
    });

    res.status(201).json({
      message: 'Tenant registered successfully',
      tenantId: result.tenant.id,
      subdomain: result.tenant.subdomain
    });
  } catch (error) {
    next(error);
  }
};

// 3. Customer Registration (Tenant Context required)
export const registerCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return next(new AppError('Tenant context is required', 400));
    }

    const body = customerRegisterSchema.parse(req.body);

    // Check customer uniqueness for this tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId,
        email: body.email
      }
    });

    if (existingCustomer) {
      return next(new AppError('Customer email is already registered on this store', 400));
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        passwordHash,
        phone: body.phone,
        isActive: true
      }
    });

    await logAuditAction({
      tenantId,
      action: 'CUSTOMER_REGISTERED',
      entityName: 'Customer',
      entityId: customer.id
    });

    res.status(201).json({
      message: 'Customer registered successfully',
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Customer Login (Tenant Context required)
export const customerLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return next(new AppError('Tenant context is required', 400));
    }

    const { email, password } = loginSchema.parse(req.body);

    const customer = await prisma.customer.findFirst({
      where: {
        tenantId,
        email
      }
    });

    if (!customer || !(await bcrypt.compare(password, customer.passwordHash))) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (!customer.isActive) {
      return next(new AppError('Customer account is deactivated', 403));
    }

    // Customer JWT has Customer role
    const accessToken = jwt.sign(
      { userId: customer.id, email: customer.email, role: 'Customer', tenantId: customer.tenantId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    await logAuditAction({
      tenantId,
      action: 'CUSTOMER_LOGIN',
      entityName: 'Customer',
      entityId: customer.id
    });

    res.json({
      accessToken,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        tenantId: customer.tenantId
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Token Refresh (for SuperAdmin/TenantAdmin users)
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = tokenRefreshSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        refreshToken,
        refreshTokenExpiryTime: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    const tokens = generateTokens(user);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: tokens.refreshToken,
        refreshTokenExpiryTime: expiryDate
      }
    });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    next(error);
  }
};
