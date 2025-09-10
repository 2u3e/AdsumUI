import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Auth gerektirmeyen URL'ler
  const skipAuthUrls = ['/auth/login', '/auth/refresh', '/auth/register'];
  const shouldSkipAuth = skipAuthUrls.some(url => req.url.includes(url));
  
  if (shouldSkipAuth) {
    return next(req);
  }

  // Token'ı header'a ekle
  const token = authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized - Token geçersiz veya süresi dolmuş
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Yeni token ile isteği tekrarla
            const newToken = authService.getToken();
            if (newToken) {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(retryReq);
            }
            return throwError(() => error);
          }),
          catchError(() => {
            // Refresh token da geçersizse logout yap
            authService.logout();
            return throwError(() => error);
          })
        );
      }

      return throwError(() => error);
    })
  );
};