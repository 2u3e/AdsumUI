import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth/auth.service';

// @Component({
//   selector: 'app-header',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './header.component.html',
//   styleUrls: ['./header.component.scss']
// })

@Component({
  selector: '[app-header]',
  templateUrl: './header.component.html',
})

export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Reactive state
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;
  
  // Logout loading state
  isLoggingOut = signal(false);

  /**
   * Logout butonu click handler
   */
  onLogout(event: Event): void {
    event.preventDefault();
    
    if (this.isLoggingOut()) return;

    // Onay dialog (opsiyonel)
    // const confirmed = confirm('Çıkış yapmak istediğinize emin misiniz?');
    // if (!confirmed) return;

    this.isLoggingOut.set(true);

    // AuthService logout otomatik olarak:
    // 1. Backend'e logout isteği gönderir (opsiyonel)
    // 2. Token'ları temizler
    // 3. Login sayfasına yönlendirir
    this.authService.logout();
    
    // Loading state'i biraz sonra kapat (redirect olacağı için)
    setTimeout(() => this.isLoggingOut.set(false), 1000);
  }

  /**
   * Profil sayfasına git
   */
  goToProfile(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/profile']);
  }

  /**
   * Theme toggle
   */
  onThemeToggle(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const theme = checkbox.checked ? 'dark' : 'light';
    // Theme service'inizi çağırın
    console.log('Theme changed to:', theme);
  }

  /**
   * Get user avatar initials
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.userName?.charAt(0)?.toUpperCase() || 'U';
  }

  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    const user = this.currentUser();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.userName || 'Kullanıcı';
  }
}
