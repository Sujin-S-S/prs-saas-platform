import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const tenantId = authService.currentTenantIdSignal();

  let cloned = req;

  // 1. Inject Authorization header if JWT token is stored
  if (token) {
    cloned = cloned.clone({
      headers: cloned.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  // 2. Inject X-Tenant-Id header if tenant context is resolved
  if (tenantId) {
    cloned = cloned.clone({
      headers: cloned.headers.set('x-tenant-id', tenantId)
    });
  }

  return next(cloned);
};
