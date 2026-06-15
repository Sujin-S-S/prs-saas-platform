import { Router } from 'express';
import * as auth from '../controllers/authController';
import * as products from '../controllers/productController';
import * as orders from '../controllers/orderController';
import * as coupons from '../controllers/couponController';
import * as customers from '../controllers/customerController';
import * as tenants from '../controllers/tenantController';
import { authenticate, authorize } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenantResolver';

const router = Router();

// ==========================================
// 1. PUBLIC & AUTHENTICATION ENDPOINTS
// ==========================================
router.post('/auth/login', auth.login);
router.post('/auth/register-tenant', auth.registerTenant);
router.post('/auth/refresh-token', auth.refreshToken);

// Customer Auth (requires tenant context)
router.post('/auth/register-customer', resolveTenant, requireTenant, auth.registerCustomer);
router.post('/auth/customer-login', resolveTenant, requireTenant, auth.customerLogin);

// ==========================================
// 2. SUPER ADMIN PORTAL ROUTING
// ==========================================
router.get('/superadmin/tenants', authenticate, authorize('SuperAdmin'), tenants.getTenants);
router.put('/superadmin/tenants/:id', authenticate, authorize('SuperAdmin'), tenants.updateTenant);
router.get('/superadmin/dashboard', authenticate, authorize('SuperAdmin'), tenants.getDashboardStats);
router.get('/superadmin/audit-logs', authenticate, authorize('SuperAdmin'), tenants.getAuditLogs);

// ==========================================
// 3. CATEGORIES ENDPOINTS (Tenant Isolated)
// ==========================================
router.get('/categories', resolveTenant, requireTenant, products.getCategories);
router.post(
  '/categories',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  products.createCategory
);
router.put(
  '/categories/:id',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  products.updateCategory
);
router.delete(
  '/categories/:id',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  products.deleteCategory
);

// ==========================================
// 4. PRODUCTS ENDPOINTS (Tenant Isolated)
// ==========================================
router.get('/products', resolveTenant, requireTenant, products.getProducts);
router.get('/products/:id', resolveTenant, requireTenant, products.getProductById);
router.post(
  '/products',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  products.createProduct
);
router.put(
  '/products/:id',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  products.updateProduct
);
router.delete(
  '/products/:id',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  products.deleteProduct
);

// ==========================================
// 5. COUPONS ENDPOINTS (Tenant Isolated)
// ==========================================
router.post('/coupons/validate', resolveTenant, requireTenant, coupons.validateCoupon);

// Tenant Admin management routes for coupons
router.get(
  '/coupons',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  coupons.getCoupons
);
router.post(
  '/coupons',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  coupons.createCoupon
);
router.delete(
  '/coupons/:id',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  coupons.deleteCoupon
);

// ==========================================
// 6. CUSTOMER MANAGEMENT ENDPOINTS (Tenant Isolated)
// ==========================================
router.get(
  '/customers',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  customers.getCustomers
);
router.get(
  '/customers/:id',
  resolveTenant,
  requireTenant,
  authenticate,
  customers.getCustomerById
);
router.put(
  '/customers/:id',
  resolveTenant,
  requireTenant,
  authenticate,
  customers.updateCustomer
);

// ==========================================
// 7. ORDER MANAGEMENT ENDPOINTS (Tenant Isolated)
// ==========================================
router.get(
  '/orders',
  resolveTenant,
  requireTenant,
  authenticate,
  orders.getOrders
);
router.get(
  '/orders/:id',
  resolveTenant,
  requireTenant,
  authenticate,
  orders.getOrderById
);
router.post(
  '/orders',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('Customer'),
  orders.createOrder
);
router.put(
  '/orders/:id/status',
  resolveTenant,
  requireTenant,
  authenticate,
  authorize('TenantAdmin'),
  orders.updateOrderStatus
);
router.get(
  '/orders/:id/invoice',
  resolveTenant,
  requireTenant,
  authenticate,
  orders.generateInvoice
);

export default router;
