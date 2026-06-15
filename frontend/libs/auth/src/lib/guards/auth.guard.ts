import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const isAuth = authService.isAuthenticated();
    const role = authService.userRole();

    if (!isAuth) {
      router.navigate(['/login']);
      return false;
    }

    if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
};
