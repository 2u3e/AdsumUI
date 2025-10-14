import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { User } from '../../models/auth.models';

/**
 * OAuth 2.0 Token Response (OpenIddict)
 */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * Login Credentials
 */
interface LoginCredentials {
  username: string;
  password: string;
}

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

  // Refresh token management
  private refreshTokenTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.checkStoredAuth();
  }

  /**
   * OAuth 2.0 Password Grant
   * https://datatracker.ietf.org/doc/html/rfc6749#section-4.3
   */
  login(credentials: LoginCredentials): Observable<TokenResponse> {
    // OAuth 2.0 requires application/x-www-form-urlencoded
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('username', credentials.username);
    body.set('password', credentials.password);
    body.set('scope', 'openid email profile roles offline_access');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<TokenResponse>(
      `${environment.apiUrl}/connect/token`,
      body.toString(),
      { headers }
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * OAuth 2.0 Refresh Token Grant
   * https://datatracker.ietf.org/doc/html/rfc6749#section-6
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<TokenResponse>(
      `${environment.apiUrl}/connect/token`,
      body.toString(),
      { headers }
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError((error) => {
        console.error('Refresh token error:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout işlemi
   */
  logout(): void {
    this.stopRefreshTokenTimer();
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  /**
   * Token response'u işle
   */
  private handleAuthSuccess(response: TokenResponse): void {
    // Token'ları kaydet
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    if (response.refresh_token) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh_token);
    }

    // JWT'den user bilgilerini çıkar
    const user = this.parseTokenToUser(response.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    // State güncelle
    this.isAuthenticated.set(true);
    this.currentUser.set(user);
    this.currentUserSubject.next(user);

    // Auto refresh başlat
    this.startRefreshTokenTimer(response.expires_in);
  }

  /**
   * JWT token'dan user bilgilerini çıkar
   */
  private parseTokenToUser(token: string): User {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      return {
        id: payload.sub || '',
        email: payload.email || '',
        userName: payload.name || payload.unique_name || '',
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        roles: payload.role ? (Array.isArray(payload.role) ? payload.role : [payload.role]) : [],
        permissions: payload.permissions || []
      };
    } catch (error) {
      console.error('Token parse error:', error);
      return {
        id: '',
        email: '',
        userName: 'Kullanıcı',
        firstName: '',
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
    
    if (token && user && this.isTokenValid()) {
      this.isAuthenticated.set(true);
      this.currentUser.set(user);
      this.currentUserSubject.next(user);
      
      // Kalan süreyi hesapla ve timer başlat
      const remainingTime = this.getTokenRemainingTime();
      if (remainingTime > 60) {
        this.startRefreshTokenTimer(remainingTime);
      } else {
        // Token süresi çok az kaldıysa hemen refresh et
        this.refreshToken().subscribe();
      }
    } else {
      this.clearAuthData();
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
      const currentTime = Date.now();
      
      // Token'ın süresinin dolmasına 1 dakika kaldıysa false döndür
      const timeUntilExpiry = expirationTime - currentTime;
      return timeUntilExpiry > 60000; // 60 saniye
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
   * Kullanıcının belirli rollerden herhangi birine sahip mi?
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser();
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  }

  /**
   * Kullanıcının tüm rollere sahip mi?
   */
  hasAllRoles(roles: string[]): boolean {
    const user = this.currentUser();
    if (!user?.roles) return false;
    return roles.every(role => user.roles.includes(role));
  }

  /**
   * Kullanıcının belirli bir izni var mı?
   */
  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    return user?.permissions?.includes(permission) ?? false;
  }

  /**
   * Token yenileme timer'ını başlat
   * Token'ın süresinin bitmesinden 1 dakika önce otomatik yeniler
   */
  private startRefreshTokenTimer(expiresIn: number): void {
    // expiresIn saniye cinsinden geliyor
    // Token'ın süresinin bitmesinden 60 saniye önce yenile
    const timeout = (expiresIn - 60) * 1000; // milliseconds

    if (timeout > 0) {
      this.stopRefreshTokenTimer();
      this.refreshTokenTimeout = setTimeout(() => {
        this.refreshToken().subscribe({
          error: (err) => console.error('Auto refresh failed:', err)
        });
      }, timeout);
    }
  }

  /**
   * Token yenileme timer'ını durdur
   */
  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = undefined;
    }
  }

  /**
   * Token'ın kalan süresini al (saniye cinsinden)
   */
  private getTokenRemainingTime(): number {
    const token = this.getToken();
    if (!token) return 0;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const remainingTime = Math.max(0, expirationTime - Date.now());
      return Math.floor(remainingTime / 1000); // Saniyeye çevir
    } catch {
      return 0;
    }
  }
}