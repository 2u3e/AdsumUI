import { Component, HostBinding, AfterViewInit, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../core/services/auth/auth.service';
import { MetronicInitService } from '../../core/services/metronic-init.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  @HostBinding('class') class = 'flex grow';
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private metronicInitService = inject(MetronicInitService);
  
  private destroy$ = new Subject<void>();

  // Reactive signals
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  loginForm: FormGroup;
  returnUrl: string = '/';

  constructor() {
    // OAuth 2.0 username field (email veya username)
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Return URL'i al
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  ngAfterViewInit(): void {
    this.metronicInitService.init();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Login form submit
   */
  onSubmit(): void {
    // Hata mesajını temizle
    this.errorMessage.set(null);

    // Form validation
    if (!this.loginForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);

    const credentials = {
      username: this.loginForm.value.username.trim(),
      password: this.loginForm.value.password
    };

    this.authService.login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          
          // OAuth 2.0 başarılı response access_token içerir
          if (response.access_token) {
            console.log('Login successful, redirecting to:', this.returnUrl);
            this.router.navigate([this.returnUrl]);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Login error:', error);
          
          // OAuth 2.0 error response parsing
          let errorMsg = 'Bir hata oluştu!';
          
          if (error.status === 400) {
            // OAuth 2.0 error response format
            if (error.error?.error === 'invalid_grant') {
              errorMsg = error.error?.error_description || 'Kullanıcı adı/email veya şifre hatalı!';
            } else {
              errorMsg = 'Lütfen tüm alanları doldurun!';
            }
          } else if (error.status === 401) {
            errorMsg = 'Kullanıcı adı/email veya şifre hatalı!';
          } else if (error.status === 0) {
            errorMsg = 'Sunucuya bağlanılamadı! Lütfen internet bağlantınızı kontrol edin.';
          } else if (error.status >= 500) {
            errorMsg = 'Sunucu hatası! Lütfen daha sonra tekrar deneyin.';
          }
          
          this.errorMessage.set(errorMsg);
        }
      });
  }

  /**
   * Şifre görünürlüğünü değiştir
   */
  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  /**
   * Form kontrollerini touched olarak işaretle
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Form alanı geçersiz mi?
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Form alanı hata mesajını al
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (!field?.errors || (!field.dirty && !field.touched)) {
      return '';
    }

    if (fieldName === 'username') {
      if (field.errors['required']) {
        return 'Kullanıcı adı veya email gereklidir';
      }
      if (field.errors['minlength']) {
        return 'En az 3 karakter olmalıdır';
      }
    }
    
    if (fieldName === 'password') {
      if (field.errors['required']) {
        return 'Şifre gereklidir';
      }
      if (field.errors['minlength']) {
        return 'Şifre en az 6 karakter olmalıdır';
      }
    }
    
    return 'Geçersiz değer';
  }

  /**
   * Enter tuşuna basıldığında form submit
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.loginForm.valid && !this.isLoading()) {
      this.onSubmit();
    }
  }
}