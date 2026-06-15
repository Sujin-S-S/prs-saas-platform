import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Tenant, AuditLog } from '@frontend/shared';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminApiService {
  private api = inject(ApiService);

  // Tenants Management
  getTenants(): Observable<Tenant[]> {
    return this.api.get<Tenant[]>('/api/superadmin/tenants');
  }

  updateTenant(id: string, payload: { name?: string; isActive?: boolean }): Observable<Tenant> {
    return this.api.put<Tenant>(`/api/superadmin/tenants/${id}`, payload);
  }

  // Dashboard Stats
  getDashboardStats(): Observable<{
    totalTenants: number;
    totalOrders: number;
    totalRevenue: number;
    latestTenants: Tenant[];
  }> {
    return this.api.get<any>('/api/superadmin/dashboard');
  }

  // Audit Logs
  getAuditLogs(params: { page?: number; limit?: number } = {}): Observable<{
    logs: AuditLog[];
    total: number;
    totalPages: number;
  }> {
    return this.api.get<any>('/api/superadmin/audit-logs', params);
  }
}
