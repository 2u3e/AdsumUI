import { Component, inject, signal, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { Subscription } from "rxjs";

import { AuthService } from "../../core/services/auth/auth.service";

@Component({
  selector: "[app-header]",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./header.component.html",
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private routerSubscription?: Subscription;

  // Reactive state
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;

  // Breadcrumb navigation
  breadcrumbs = signal<{ label: string; path?: string }[]>([]);

  // Route to breadcrumb mapping
  private routeBreadcrumbMap: Record<
    string,
    { label: string; path?: string }[]
  > = {
    "/user-management": [
      { label: "Ana Sayfa", path: "/" },
      { label: "Tanımlamalar" },
      { label: "Kullanıcı Yönetimi" },
    ],
    "/organization": [
      { label: "Ana Sayfa", path: "/" },
      { label: "Tanımlamalar" },
      { label: "Birim Yönetimi" },
    ],
    "/citizen": [
      { label: "Ana Sayfa", path: "/" },
      { label: "Tanımlamalar" },
      { label: "Vatandaş Yönetimi" },
    ],
    "/role": [
      { label: "Ana Sayfa", path: "/" },
      { label: "Tanımlamalar" },
      { label: "Rol Yönetimi" },
    ],
    "/reference": [
      { label: "Ana Sayfa", path: "/" },
      { label: "Sistem Yönetimi" },
      { label: "Reference Yönetimi" },
    ],
    "/reference-data": [
      { label: "Ana Sayfa", path: "/" },
      { label: "Sistem Yönetimi" },
      { label: "Reference Data Yönetimi" },
    ],
    "/menu": [
      { label: "Ana Sayfa", path: "/" },
      { label: "Sistem Yönetimi" },
      { label: "Menü Yönetimi" },
    ],
  };

  // Logout loading state
  isLoggingOut = signal(false);

  ngOnInit(): void {
    // Update page info on route change
    this.routerSubscription = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageInfo();
      });

    // Initial update
    this.updatePageInfo();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private updatePageInfo(): void {
    const currentPath = this.router.url.split("?")[0];
    const breadcrumbs = this.routeBreadcrumbMap[currentPath];

    if (breadcrumbs) {
      this.breadcrumbs.set(breadcrumbs);
    } else {
      this.breadcrumbs.set([{ label: "Ana Sayfa", path: "/" }]);
    }
  }

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
    this.router.navigate(["/profile"]);
  }

  /**
   * Theme toggle
   */
  onThemeToggle(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const theme = checkbox.checked ? "dark" : "light";
    // Theme service'inizi çağırın
    console.log("Theme changed to:", theme);
  }

  /**
   * Get user avatar initials
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.userName?.charAt(0)?.toUpperCase() || "U";
  }

  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    const user = this.currentUser();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.userName || "Kullanıcı";
  }
}
