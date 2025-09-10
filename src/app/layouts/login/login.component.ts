import { Component, HostBinding, AfterViewInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/services/auth/auth.service';
import { MetronicInitService } from '../../core/services/metronic-init.service';
import { LoginRequest } from '../../core/models/auth.models';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit {
  @HostBinding('class') class = 'flex grow';
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private metronicInitService = inject(MetronicInitService);

  // Reactive signals
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  loginForm: FormGroup;
  returnUrl: string = '/';

  constructor() {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Return URL'i al
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  ngAfterViewInit(): void {
    this.metronicInitService.init();
  }

  /**
   * Login form submit
   */
  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const credentials: LoginRequest = {
        userName: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          
          if (response.errors.length === 0) {
            // Başarılı giriş - return URL'e yönlendir
            this.router.navigate([this.returnUrl]);
          } else {
            this.errorMessage.set(response.message || 'Giriş başarısız!');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          
          if (error.status === 401) {
            this.errorMessage.set('Email veya şifre hatalı!');
          } else if (error.status === 0) {
            this.errorMessage.set('Sunucuya bağlanılamadı!');
          } else {
            this.errorMessage.set(error.error?.message || 'Bir hata oluştu!');
          }
        }
      });
    } else {
      // Form geçersizse hataları göster
      this.markFormGroupTouched();
    }
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
    
    if (field?.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'Email' : 'Şifre'} gereklidir`;
      }
      if (field.errors['email']) {
        return 'Geçerli bir email adresi giriniz';
      }
      if (field.errors['minlength']) {
        return 'Şifre en az 6 karakter olmalıdır';
      }
    }
    
    return '';
  }
}