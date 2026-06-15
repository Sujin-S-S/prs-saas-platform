import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@frontend/auth';
import { SuperAdminApiService } from '@frontend/api-client';
import { NotificationService, Tenant, AuditLog } from '@frontend/shared';
import { LoaderComponent, DataTableComponent, TableColumn } from '@frontend/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, DataTableComponent],
  template: `
    <ui-loader [isLoading]="isLoading()" [message]="loaderMessage()"></ui-loader>

    <div class="super-container">
      <!-- Header Bar -->
      <header class="super-header">
        <div class="logo-area">
          <span class="material-icons super-icon">admin_panel_settings</span>
          <h1>PRS SaaS Platform Control</h1>
        </div>
        <div class="user-action" *ngIf="auth.isAuthenticated()">
          <span class="user-greeting">System Admin: <strong>{{ auth.currentUser()?.firstName }}</strong></span>
          <button class="logout-btn" (click)="logout()">Sign Out</button>
        </div>
      </header>

      <!-- 1. LOGIN SCREEN -->
      <main class="login-wrapper" *ngIf="!auth.isAuthenticated()">
        <div class="login-card">
          <div class="login-header">
            <h2>Super Admin Login</h2>
            <p>Access the global platform workspace to control tenants and audit system actions.</p>
          </div>

          <form (ngSubmit)="onLogin()" #loginForm="ngForm" class="login-form">
            <div class="form-group">
              <label for="email">Platform Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                [(ngModel)]="email" 
                required 
                placeholder="superadmin@prs.com"
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

            <button type="submit" class="submit-btn" [disabled]="loginForm.invalid">Access Workspace</button>
          </form>

          <div class="credentials-hint">
            <p><strong>SuperAdmin Login Credentials:</strong></p>
            <p>Email: <code>superadmin@prs.com</code> / Password: <code>admin123</code></p>
          </div>
        </div>
      </main>

      <!-- 2. SUPER ADMIN WORKSPACE -->
      <main class="workspace-wrapper" *ngIf="auth.isAuthenticated()">
        <!-- Summary Stats Cards -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon bg-blue">
              <span class="material-icons">business</span>
            </div>
            <div class="stat-content">
              <h3>Registered Tenants</h3>
              <p class="stat-value">{{ totalTenants() }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-orange">
              <span class="material-icons">receipt_long</span>
            </div>
            <div class="stat-content">
              <h3>Total Orders Processed</h3>
              <p class="stat-value">{{ totalOrders() }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-green">
              <span class="material-icons">savings</span>
            </div>
            <div class="stat-content">
              <h3>System Billing Value</h3>
              <p class="stat-value">{{ totalRevenue() | currency }}</p>
            </div>
          </div>
        </section>

        <!-- Dynamic Tenants List Table -->
        <section class="table-section mb-24">
          <div class="section-header">
            <h3>Registered SaaS Clients (Tenants)</h3>
          </div>
          
          <ui-data-table
            [data]="tenants()"
            [columns]="tenantColumns"
            [totalItems]="tenants().length"
            [showPaginator]="false"
            (edit)="onToggleTenantStatus($event)"
            (delete)="onDeleteTenant($event)">
          </ui-data-table>
        </section>

        <!-- Dynamic Audit Logs Table -->
        <section class="table-section">
          <div class="section-header">
            <h3>Platform Security Audit Trail</h3>
          </div>
          
          <ui-data-table
            [data]="auditLogs()"
            [columns]="auditColumns"
            [totalItems]="auditLogs().length"
            [showPaginator]="false">
          </ui-data-table>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .super-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }
    .super-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-bottom: 1px solid #cbd5e1;
      margin-bottom: 24px;
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .super-icon {
      font-size: 32px;
      color: #0f172a;
    }
    .logo-area h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #0f172a;
    }
    .user-greeting {
      font-size: 14px;
      margin-right: 16px;
      color: #475569;
    }
    .logout-btn {
      background: none;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    .logout-btn:hover {
      background: #f1f5f9;
    }

    /* Login card style */
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 150px);
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      background: white;
      padding: 36px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .login-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
    }
    .login-header p {
      margin: 0 0 24px 0;
      font-size: 14px;
      color: #475569;
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
      color: #475569;
    }
    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 14px;
      font-family: inherit;
    }
    .form-control:focus {
      outline: none;
      border-color: #0f172a;
    }
    .submit-btn {
      width: 100%;
      background: #0f172a;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    .submit-btn:hover:not(:disabled) {
      background: #1e293b;
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .credentials-hint {
      margin-top: 24px;
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border: 1px dashed #cbd5e1;
      font-size: 13px;
      color: #475569;
    }
    .credentials-hint p {
      margin: 4px 0;
    }

    /* Dashboard Stats Wrapper */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.01);
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
    .bg-blue { background-color: #1d4ed8; }
    .bg-orange { background-color: #ea580c; }
    .bg-green { background-color: #16a34a; }
    
    .stat-content h3 {
      margin: 0 0 4px 0;
      font-size: 13px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
    }

    .table-section {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.01);
    }
    .mb-24 {
      margin-bottom: 24px;
    }
    .section-header {
      margin-bottom: 20px;
    }
    .section-header h3 {
      margin: 0;
      font-size: 18px;
      color: #0f172a;
    }
  `]
})
export class LoginComponent {
  auth = inject(AuthService);
  superApi = inject(SuperAdminApiService);
  notifier = inject(NotificationService);

  isLoading = signal(false);
  loaderMessage = signal('');

  email = 'superadmin@prs.com';
  password = 'admin123';

  // Stats signals
  totalTenants = signal(0);
  totalOrders = signal(0);
  totalRevenue = signal(0);

  // Lists signals
  tenants = signal<Tenant[]>([]);
  auditLogs = signal<AuditLog[]>([]);

  // Tables Config
  tenantColumns: TableColumn[] = [
    { key: 'name', label: 'Client (Tenant) Name', sortable: true },
    { key: 'subdomain', label: 'Domain Slug', sortable: true },
    { key: 'isActive', label: 'Status', sortable: true, type: 'badge' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  auditColumns: TableColumn[] = [
    { key: 'timestamp', label: 'Timestamp', sortable: true, type: 'date' },
    { key: 'action', label: 'Action Taken', sortable: true },
    { key: 'entityName', label: 'Target Entity', sortable: true },
    { key: 'entityId', label: 'Target ID' }
  ];

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.loadWorkspace();
    }
  }

  onLogin(): void {
    this.isLoading.set(true);
    this.loaderMessage.set('Accessing System Workspace...');
    
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notifier.success('Logged in successfully to PRS Super Admin portal!');
        this.loadWorkspace();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notifier.error(err.error?.message || 'Login failed. Please check credentials.');
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.tenants.set([]);
    this.auditLogs.set([]);
    this.totalTenants.set(0);
    this.totalOrders.set(0);
    this.totalRevenue.set(0);
  }

  loadWorkspace(): void {
    this.isLoading.set(true);
    this.loaderMessage.set('Loading global platform metrics...');

    // Load tenants
    this.superApi.getTenants().subscribe({
      next: (res) => {
        this.tenants.set(res);
        
        // Load stats
        this.superApi.getDashboardStats().subscribe({
          next: (stats) => {
            this.totalTenants.set(stats.totalTenants);
            this.totalOrders.set(stats.totalOrders);
            this.totalRevenue.set(stats.totalRevenue);
            
            // Load audit logs
            this.superApi.getAuditLogs().subscribe({
              next: (logsRes) => {
                this.auditLogs.set(logsRes.logs);
                this.isLoading.set(false);
              },
              error: () => {
                this.isLoading.set(false);
              }
            });
          },
          error: () => {
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.notifier.error('Failed to load SuperAdmin workspace.');
      }
    });
  }

  onToggleTenantStatus(row: any): void {
    const nextStatus = !row.isActive;
    this.isLoading.set(true);
    this.loaderMessage.set('Toggling client store status...');

    this.superApi.updateTenant(row.id, { isActive: nextStatus }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notifier.success(`Tenant ${row.name} status updated successfully!`);
        this.loadWorkspace(); // Refresh list
      },
      error: () => {
        this.isLoading.set(false);
        this.notifier.error('Failed to toggle tenant active status.');
      }
    });
  }

  onDeleteTenant(row: any): void {
    this.notifier.info(`Delete triggered for Tenant: ${row.name} (Control constraint locked)`);
  }
}
