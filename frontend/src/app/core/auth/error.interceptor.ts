import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authService.logout();
        toast.warning('Session expired. Please log in again.', 'Unauthorized');
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        toast.error('You do not possess the required permissions for this action.', 'Access Denied');
      } else if (error.status >= 500) {
        toast.error('An unexpected server error occurred. Please try again.', 'Server Error');
      }
      return throwError(() => error);
    })
  );
};
