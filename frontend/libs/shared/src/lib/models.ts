export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId?: string | null;
  email: string;
  role: 'SuperAdmin' | 'TenantAdmin';
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  category?: Category;
  name: string;
  description?: string;
  sku: string;
  basePrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export interface ProductVariant {
  id: string;
  tenantId: string;
  productId: string;
  name: string;
  sku: string;
  priceDifference: number;
  stockQuantity: number;
}

export interface ProductImage {
  id: string;
  tenantId: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
}

export interface Customer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Address {
  id: string;
  tenantId: string;
  customerId: string;
  type: 'Billing' | 'Shipping';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  customer?: { firstName: string; lastName: string; email: string };
  orderNumber: string;
  orderDate: Date;
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddressId: string;
  billingAddressId: string;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  tenantId: string;
  orderId: string;
  productVariantId: string;
  productVariant?: ProductVariant & { product: { name: string } };
  quantity: number;
  unitPrice: number;
}

export interface Coupon {
  id: string;
  tenantId: string;
  code: string;
  discountType: 'Percentage' | 'Flat';
  discountValue: number;
  expiryDate: Date;
  minOrderAmount: number;
  isActive: boolean;
}

export interface Payment {
  id: string;
  tenantId: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  status: 'Pending' | 'Completed' | 'Failed';
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  tenantId?: string | null;
  tenant?: { name: string };
  userId?: string | null;
  user?: { email: string; role: string };
  action: string;
  entityName: string;
  entityId?: string | null;
  timestamp: Date;
  changesJson?: string;
}
