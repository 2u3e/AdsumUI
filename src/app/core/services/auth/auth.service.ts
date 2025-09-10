import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { LoginRequest, LoginResponse, User, TokenInfo } from '../../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'adsum_token';
  private readonly REFRESH_TOKEN_KEY = 'adsum_refresh_token';
  private readonly USER_KEY = 'adsum_user';

  // Signals for reactive state management
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<User | null>(null);

  constructor() {
    this.checkStoredAuth();
  }

  /**
   * Login kullanıcısı
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.statusCode === 200) {
            this.setAuthData(response);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }

  /**
   * Logout işlemi
   */
  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  /**
   * Token yenileme
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return of({} as LoginResponse);
    }

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, {
      refreshToken
    }).pipe(
      tap(response => {
        if (response.statusCode === 200) {
          this.setAuthData(response);
        } else {
          this.logout();
        }
      }),
      catchError(() => {
        this.logout();
        return of({} as LoginResponse);
      })
    );
  }

  /**
   * Auth verilerini kaydet
   */
  private setAuthData(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.data.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.data.refreshToken);
    
    // JWT token'dan user bilgilerini çıkar
    const user = this.parseTokenToUser(response.data.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    this.isAuthenticated.set(true);
    this.currentUser.set(user);
    this.currentUserSubject.next(user);
  }

  /**
   * JWT token'dan user bilgilerini çıkar
   */
  private parseTokenToUser(token: string): User {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub || payload.userId || '1',
        email: payload.email || '',
        userName: payload.userName || payload.unique_name || '',
        firstName: payload.given_name || payload.firstName || '',
        lastName: payload.family_name || payload.lastName || '',
        roles: payload.role ? (Array.isArray(payload.role) ? payload.role : [payload.role]) : [],
        permissions: payload.permissions || []
      };
    } catch (error) {
      console.error('Token parse error:', error);
      return {
        id: '1',
        email: '',
        userName: '',
        firstName: 'Kullanıcı',
        lastName: '',
        roles: [],
        permissions: []
      };
    }
  }

  /**
   * Auth verilerini temizle
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.currentUserSubject.next(null);
  }

  /**
   * Saklanan auth durumunu kontrol et
   */
  private checkStoredAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();
    
    if (token && user) {
      this.isAuthenticated.set(true);
      this.currentUser.set(user);
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Token al
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Refresh token al
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Saklanan kullanıcı bilgisini al
   */
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Token geçerli mi kontrol et
   */
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() < expirationTime;
    } catch {
      return false;
    }
  }

  /**
   * Kullanıcının belirli bir rolü var mı?
   */
  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.roles?.includes(role) ?? false;
  }

  /**
   * Kullanıcının belirli bir izni var mı?
   */
  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    return user?.permissions?.includes(permission) ?? false;
  }
}