import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError, retry, timer } from 'rxjs';

import { AuthService } from '../services/auth/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // OAuth 2.0 token endpoint'lerini skip et
  const skipAuthUrls = [
    '/connect/token',           // OpenIddict token endpoint
    '/connect/authorize',       // OpenIddict authorization endpoint
    '/connect/userinfo',        // OpenIddict userinfo endpoint
    '/auth/register',           // Register endpoint (varsa)
    '/auth/forgot-password',    // Forgot password endpoint (varsa)
    '/auth/reset-password'      // Reset password endpoint (varsa)
  ];
  
  const shouldSkipAuth = skipAuthUrls.some(url => req.url.includes(url));
  
  // Token ekle (skip edilmeyecekse)
  let authReq = req;
  if (!shouldSkipAuth) {
    const token = authService.getToken();
    if (token) {
      authReq = addToken(req, token);
    }
  }

  return next(authReq).pipe(
    // Network errors için retry
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Sadece network hataları için retry yap (status 0)
        // 4xx ve 5xx hatalarında retry yapma
        if (error.status === 0 || error.status === 504) {
          return timer(retryCount * 1000); // 1s, 2s delay
        }
        // Retry yapılmayacak hataları hemen throw et
        throw error;
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized - Token geçersiz veya süresi dolmuş
      if (error.status === 401 && !shouldSkipAuth) {
        return handle401Error(authReq, next, authService);
      }

      // 403 Forbidden - Yetki yok
      if (error.status === 403) {
        console.error('Access forbidden:', error);
      }

      // 404 Not Found
      if (error.status === 404) {
        console.error('Resource not found:', error);
      }

      // 500+ Server errors
      if (error.status >= 500) {
        console.error('Server error:', error);
      }

      // Network error (status 0)
      if (error.status === 0) {
        console.error('Network error - unable to connect to server');
      }

      return throwError(() => error);
    })
  );
};

/**
 * Token'ı request header'ına ekle
 * OAuth 2.0 Bearer Token standardı
 */
function addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * 401 hatası için token yenileme ve retry logic
 */
function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;

    return authService.refreshToken().pipe(
      switchMap(() => {
        isRefreshing = false;
        // Yeni token ile isteği tekrarla
        const newToken = authService.getToken();
        if (newToken) {
          const retryReq = addToken(request, newToken);
          return next(retryReq);
        }
        return throwError(() => new Error('No token available'));
      }),
      catchError((error) => {
        isRefreshing = false;
        // Refresh token da başarısızsa logout yap
        authService.logout();
        return throwError(() => error);
      })
    );
  } else {
    // Bir refresh işlemi zaten devam ediyorsa bekle
    // Gerçek uygulamalarda burada bir BehaviorSubject kullanılabilir
    return throwError(() => new Error('Token refresh in progress'));
  }
}