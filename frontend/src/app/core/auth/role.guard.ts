import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const expectedRoles = (route.data?.['roles'] as string[]) || [];

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  const userRole = authService.userRole();
  if (userRole && (expectedRoles.length === 0 || expectedRoles.includes(userRole))) {
    return true;
  }

  toast.error(`Access restricted. Requires role: [${expectedRoles.join(', ')}]`, 'Insufficient Privileges');
  return router.createUrlTree(['/dashboard']);
};
