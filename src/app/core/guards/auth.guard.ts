import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth/auth.service';

/**
 * Authentication Guard - Kullanıcı giriş yapmış mı kontrol eder
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Token geçerli mi kontrol et
  if (authService.isAuthenticated() && authService.isTokenValid()) {
    return true;
  }

  // Login sayfasına yönlendir
  console.log('User not authenticated, redirecting to login');
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};

/**
 * Login Guard - Zaten giriş yapmış kullanıcıları login sayfasından uzaklaştırır
 */
export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Eğer zaten giriş yapmışsa ana sayfaya yönlendir
  if (authService.isAuthenticated() && authService.isTokenValid()) {
    console.log('User already authenticated, redirecting to home');
    router.navigate(['/']);
    return false;
  }

  return true;
};

/**
 * Role Guard Factory - Belirli rollere sahip kullanıcılar için
 * Kullanım: canActivate: [roleGuard(['Admin', 'Manager'])]
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Önce authentication kontrolü
    if (!authService.isAuthenticated() || !authService.isTokenValid()) {
      router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    // Role kontrolü
    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    // Yetkisi yoksa unauthorized sayfasına yönlendir
    console.log('User does not have required role');
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * Permission Guard Factory - Belirli izinlere sahip kullanıcılar için
 * Kullanım: canActivate: [permissionGuard(['Write', 'Delete'])]
 */
export function permissionGuard(requiredPermissions: string[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Önce authentication kontrolü
    if (!authService.isAuthenticated() || !authService.isTokenValid()) {
      router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    // Permission kontrolü
    const hasAllPermissions = requiredPermissions.every(permission => 
      authService.hasPermission(permission)
    );

    if (hasAllPermissions) {
      return true;
    }

    // İzni yoksa unauthorized sayfasına yönlendir
    console.log('User does not have required permissions');
    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * Route Data'dan role kontrolü yapan guard
 * Kullanım: 
 * {
 *   path: 'admin',
 *   canActivate: [authGuard, roleFromDataGuard],
 *   data: { roles: ['Admin'] }
 * }
 */
export const roleFromDataGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // Role gereksinimi yoksa izin ver
  }

  if (!authService.isAuthenticated() || !authService.isTokenValid()) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  console.log('User does not have required role from route data');
  router.navigate(['/unauthorized']);
  return false;
};