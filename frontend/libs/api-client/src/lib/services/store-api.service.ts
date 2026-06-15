import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product, Category, Order, Address } from '@frontend/shared';

@Injectable({
  providedIn: 'root'
})
export class StoreApiService {
  private api = inject(ApiService);

  // Store Catalog
  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/api/categories');
  }

  getProducts(params: any = {}): Observable<{ products: Product[]; total: number; totalPages: number }> {
    return this.api.get<{ products: Product[]; total: number; totalPages: number }>('/api/products', params);
  }

  getProduct(id: string): Observable<Product> {
    return this.api.get<Product>(`/api/products/${id}`);
  }

  // Coupon Validation
  validateCoupon(code: string, amount: number): Observable<{
    valid: boolean;
    discountType: 'Percentage' | 'Flat';
    discountValue: number;
    minOrderAmount: number;
  }> {
    return this.api.post<any>('/api/coupons/validate', { code, amount });
  }

  // Checkout
  checkout(orderPayload: {
    items: { productVariantId: string; quantity: number }[];
    shippingAddress: string | Partial<Address>;
    billingAddress: string | Partial<Address>;
    couponCode?: string;
    paymentMethod: string;
  }): Observable<Order> {
    return this.api.post<Order>('/api/orders', orderPayload);
  }

  // Customer Orders
  getCustomerOrders(params: any = {}): Observable<{ orders: Order[]; total: number; totalPages: number }> {
    return this.api.get<{ orders: Order[]; total: number; totalPages: number }>('/api/orders', params);
  }

  getCustomerOrder(id: string): Observable<Order> {
    return this.api.get<Order>(`/api/orders/${id}`);
  }

  getInvoice(id: string): Observable<any> {
    return this.api.get<any>(`/api/orders/${id}/invoice`);
  }
}
