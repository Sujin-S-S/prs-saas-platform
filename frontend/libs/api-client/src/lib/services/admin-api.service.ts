import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product, Category, Order, Customer, Coupon } from '@frontend/shared';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private api = inject(ApiService);

  // Categories CRUD
  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/api/categories');
  }
  createCategory(category: Partial<Category>): Observable<Category> {
    return this.api.post<Category>('/api/categories', category);
  }
  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.api.put<Category>(`/api/categories/${id}`, category);
  }
  deleteCategory(id: string): Observable<void> {
    return this.api.delete<void>(`/api/categories/${id}`);
  }

  // Products CRUD
  getProducts(params: any = {}): Observable<{ products: Product[]; total: number; totalPages: number }> {
    return this.api.get<{ products: Product[]; total: number; totalPages: number }>('/api/products', params);
  }
  getProduct(id: string): Observable<Product> {
    return this.api.get<Product>(`/api/products/${id}`);
  }
  createProduct(product: Partial<Product>): Observable<Product> {
    return this.api.post<Product>('/api/products', product);
  }
  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.api.put<Product>(`/api/products/${id}`, product);
  }
  deleteProduct(id: string): Observable<void> {
    return this.api.delete<void>(`/api/products/${id}`);
  }

  // Orders CRUD
  getOrders(params: any = {}): Observable<{ orders: Order[]; total: number; totalPages: number }> {
    return this.api.get<{ orders: Order[]; total: number; totalPages: number }>('/api/orders', params);
  }
  getOrder(id: string): Observable<Order> {
    return this.api.get<Order>(`/api/orders/${id}`);
  }
  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.api.put<Order>(`/api/orders/${id}/status`, { status });
  }
  getInvoice(id: string): Observable<any> {
    return this.api.get<any>(`/api/orders/${id}/invoice`);
  }

  // Customers CRUD
  getCustomers(): Observable<Customer[]> {
    return this.api.get<Customer[]>('/api/customers');
  }
  getCustomer(id: string): Observable<Customer> {
    return this.api.get<Customer>(`/api/customers/${id}`);
  }

  // Coupons CRUD
  getCoupons(): Observable<Coupon[]> {
    return this.api.get<Coupon[]>('/api/coupons');
  }
  createCoupon(coupon: Partial<Coupon>): Observable<Coupon> {
    return this.api.post<Coupon>('/api/coupons', coupon);
  }
  deleteCoupon(id: string): Observable<void> {
    return this.api.delete<void>(`/api/coupons/${id}`);
  }
}
