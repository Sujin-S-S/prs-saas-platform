import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@frontend/auth';
import { AdminApiService } from '@frontend/api-client';
import { NotificationService, Product, Order } from '@frontend/shared';
import { LoaderComponent, DataTableComponent, TableColumn } from '@frontend/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, DataTableComponent],
  template: `
    <ui-loader [isLoading]="isLoading()" [message]="loaderMessage()"></ui-loader>

    <div class="admin-container">
      <!-- Header Bar -->
      <header class="admin-header">
        <div class="logo-area">
          <span class="material-icons admin-icon">storefront</span>
          <h1>SK47 ADMIN PORTAL</h1>
        </div>
        <div class="user-action" *ngIf="auth.isAuthenticated()">
          <span class="user-greeting">Merchant Admin: <strong>{{ auth.currentUser()?.firstName }}</strong></span>
          <button class="logout-btn" (click)="logout()">Sign Out</button>
        </div>
      </header>

      <!-- 1. LOGIN SCREEN -->
      <main class="login-wrapper" *ngIf="!auth.isAuthenticated()">
        <div class="login-card">
          <div class="login-header">
            <h2>Merchant Login</h2>
            <p>Access your store dashboard to manage inventory and orders.</p>
          </div>

          <form (ngSubmit)="onLogin()" #loginForm="ngForm" class="login-form">
            <div class="form-group">
              <label for="email">Admin Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                [(ngModel)]="email" 
                required 
                placeholder="admin@sk47.com"
                class="form-control">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                [(ngModel)]="password" 
                required 
                placeholder="••••••••"
                class="form-control">
            </div>

            <button type="submit" class="submit-btn" [disabled]="loginForm.invalid">Access Dashboard</button>
          </form>

          <div class="credentials-hint">
            <p><strong>Merchant Login Credentials:</strong></p>
            <p>Email: <code>admin@sk47.com</code> / Password: <code>admin123</code></p>
          </div>
        </div>
      </main>

      <!-- 2. MERCHANT DASHBOARD -->
      <main class="dashboard-wrapper" *ngIf="auth.isAuthenticated()">
        <!-- Summary Stats Cards -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon bg-blue">
              <span class="material-icons">shopping_cart</span>
            </div>
            <div class="stat-content">
              <h3>Orders Today</h3>
              <p class="stat-value">{{ totalOrders() }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-green">
              <span class="material-icons">payments</span>
            </div>
            <div class="stat-content">
              <h3>Total Revenue</h3>
              <p class="stat-value">{{ totalRevenue() | currency }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" [ngClass]="lowStockCount() > 0 ? 'bg-red' : 'bg-green'">
              <span class="material-icons">inventory_2</span>
            </div>
            <div class="stat-content">
              <h3>Low Stock Alerts</h3>
              <p class="stat-value">{{ lowStockCount() }}</p>
            </div>
          </div>
        </section>

        <!-- Dynamic Product Inventory Table (using @frontend/ui ui-data-table) -->
        <section class="inventory-section">
          <div class="section-header">
            <h3>Product Inventory Management</h3>
          </div>
          
          <ui-data-table
            [data]="products()"
            [columns]="columns"
            [totalItems]="products().length"
            [showPaginator]="false"
            (edit)="onEditProduct($event)"
            (delete)="onDeleteProduct($event)">
          </ui-data-table>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-bottom: 1px solid #334155;
      margin-bottom: 24px;
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .admin-icon {
      font-size: 32px;
      color: #38bdf8;
    }
    .logo-area h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #f8fafc;
    }
    .user-greeting {
      font-size: 14px;
      margin-right: 16px;
      color: #94a3b8;
    }
    .logout-btn {
      background: none;
      border: 1px solid #475569;
      color: #f8fafc;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    .logout-btn:hover {
      background: #1e293b;
    }

    /* Login card dark style */
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 150px);
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      background: #1e293b;
      padding: 36px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      border: 1px solid #334155;
    }
    .login-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      color: #f8fafc;
    }
    .login-header p {
      margin: 0 0 24px 0;
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .form-group {
      margin-bottom: 18px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
    }
    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #475569;
      background: #0f172a;
      color: #f8fafc;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 14px;
      font-family: inherit;
    }
    .form-control:focus {
      outline: none;
      border-color: #38bdf8;
    }
    .submit-btn {
      width: 100%;
      background: #38bdf8;
      color: #0f172a;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    .submit-btn:hover:not(:disabled) {
      background: #0ea5e9;
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .credentials-hint {
      margin-top: 24px;
      background: #0f172a;
      padding: 12px;
      border-radius: 6px;
      border: 1px dashed #334155;
      font-size: 13px;
      color: #94a3b8;
    }
    .credentials-hint p {
      margin: 4px 0;
    }

    /* Dashboard Wrapper */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon span {
      font-size: 24px;
      color: white;
    }
    .bg-blue { background-color: #0284c7; }
    .bg-green { background-color: #16a34a; }
    .bg-red { background-color: #dc2626; }
    
    .stat-content h3 {
      margin: 0 0 4px 0;
      font-size: 13px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #f8fafc;
    }

    .inventory-section {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 24px;
      border-radius: 12px;
    }
    .section-header {
      margin-bottom: 20px;
    }
    .section-header h3 {
      margin: 0;
      font-size: 18px;
      color: #f8fafc;
    }
  `]
})
export class LoginComponent {
  auth = inject(AuthService);
  adminApi = inject(AdminApiService);
  notifier = inject(NotificationService);

  isLoading = signal(false);
  loaderMessage = signal('');

  email = 'admin@sk47.com';
  password = 'admin123';

  // Stats signals
  totalOrders = signal(0);
  totalRevenue = signal(0);
  lowStockCount = signal(0);

  // Table Config
  products = signal<Product[]>([]);
  columns: TableColumn[] = [
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'basePrice', label: 'Base Price', sortable: true, type: 'currency' },
    { key: 'stockQuantity', label: 'Stock Level', sortable: true },
    { key: 'lowStockThreshold', label: 'Low Alert Min', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  constructor() {
    this.auth.setTenantId('sk47'); // Admin logged to SK47 client
    if (this.auth.isAuthenticated()) {
      this.loadDashboard();
    }
  }

  onLogin(): void {
    this.isLoading.set(true);
    this.loaderMessage.set('Accessing Merchant Admin account...');
    
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notifier.success('Logged in successfully to SK47 admin portal!');
        this.loadDashboard();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notifier.error(err.error?.message || 'Login failed. Please check credentials.');
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.products.set([]);
    this.totalOrders.set(0);
    this.totalRevenue.set(0);
    this.lowStockCount.set(0);
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.loaderMessage.set('Loading Merchant Dashboard...');

    // Load Products
    this.adminApi.getProducts().subscribe({
      next: (res) => {
        this.products.set(res.products);
        this.lowStockCount.set(res.products.filter(p => p.stockQuantity <= p.lowStockThreshold).length);
        
        // Load Orders Stats
        this.adminApi.getOrders().subscribe({
          next: (orderRes) => {
            this.totalOrders.set(orderRes.total);
            const totalRev = orderRes.orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
            this.totalRevenue.set(totalRev);
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.notifier.error('Failed to load merchant dashboard metrics.');
      }
    });
  }

  onEditProduct(row: any): void {
    this.notifier.info(`Edit triggered for Product SKU: ${row.sku} (Feature scaffolding completed)`);
  }

  onDeleteProduct(row: any): void {
    this.notifier.info(`Delete triggered for Product: ${row.name} (Feature scaffolding completed)`);
  }
}
