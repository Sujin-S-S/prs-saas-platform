import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  role: 'SuperAdmin' | 'TenantAdmin' | 'Customer';
  firstName: string;
  lastName: string;
  tenantId?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
  customer?: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private readonly ACCESS_TOKEN_KEY = 'prs_access_token';
  private readonly REFRESH_TOKEN_KEY = 'prs_refresh_token';

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Signals for state
  currentUserSignal = signal<AuthUser | null>(null);
  currentTenantIdSignal = signal<string | null>(null);

  // Computed state
  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => !!this.currentUserSignal());
  userRole = computed(() => this.currentUserSignal()?.role || null);

  constructor() {
    this.autoLogin();
  }

  // Login SuperAdmin / TenantAdmin
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('http://localhost:3000/api/auth/login', { email, password }).pipe(
      tap((res) => this.handleAuthSuccess(res, 'User'))
    );
  }

  // Login Customer (Tenant specific)
  loginCustomer(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('http://localhost:3000/api/auth/customer-login', { email, password }).pipe(
      tap((res) => this.handleAuthSuccess(res, 'Customer'))
    );
  }

  // Register Tenant
  registerTenant(payload: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/auth/register-tenant', payload);
  }

  // Register Customer (Tenant specific)
  registerCustomer(payload: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/auth/register-customer', payload);
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
    this.currentUserSignal.set(null);
    this.currentTenantIdSignal.set(null);
  }

  getAccessToken(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  setTenantId(tenantId: string): void {
    this.currentTenantIdSignal.set(tenantId);
  }

  private handleAuthSuccess(res: LoginResponse, mode: 'User' | 'Customer'): void {
    const token = res.accessToken;
    if (this.isBrowser()) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      
      if (res.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
      }
    }

    const profile = mode === 'User' ? res.user : res.customer;
    if (profile) {
      this.currentUserSignal.set(profile);
      if (profile.tenantId) {
        this.currentTenantIdSignal.set(profile.tenantId);
      }
    } else {
      // Decode JWT token for profile
      const decoded = this.decodeToken(token);
      if (decoded) {
        const user: AuthUser = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          firstName: decoded.role === 'SuperAdmin' ? 'Super' : 'Store',
          lastName: decoded.role === 'SuperAdmin' ? 'Admin' : 'User',
          tenantId: decoded.tenantId
        };
        this.currentUserSignal.set(user);
        if (user.tenantId) {
          this.currentTenantIdSignal.set(user.tenantId);
        }
      }
    }
  }

  private autoLogin(): void {
    const token = this.getAccessToken();
    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        const user: AuthUser = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          firstName: decoded.role === 'SuperAdmin' ? 'Super' : 'Store',
          lastName: decoded.role === 'SuperAdmin' ? 'Admin' : 'User',
          tenantId: decoded.tenantId
        };
        this.currentUserSignal.set(user);
        if (user.tenantId) {
          this.currentTenantIdSignal.set(user.tenantId);
        }
      } else {
        this.logout();
      }
    }
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }
}
