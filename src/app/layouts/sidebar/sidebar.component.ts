import { Component, signal, computed, inject } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

interface MenuItem {
  title: string;
  path: string;
  parent?: string;
}

@Component({
  selector: "[app-sidebar]",
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: "./sidebar.component.html",
})
export class SidebarComponent {
  private router = inject(Router);

  searchQuery = signal("");
  isSearchFocused = signal(false);

  // Tüm menü öğeleri (statik liste)
  private allMenuItems: MenuItem[] = [
    {
      title: "Reference Yönetimi",
      path: "/reference",
      parent: "Sistem Yönetimi",
    },
    {
      title: "Reference Data Yönetimi",
      path: "/reference-data",
      parent: "Sistem Yönetimi",
    },
    { title: "Menü Yönetimi", path: "/menu", parent: "Sistem Yönetimi" },
    {
      title: "Kullanıcı Yönetimi",
      path: "/user-management",
      parent: "Organizasyon Yönetimi",
    },
    {
      title: "Vatandaş Yönetimi",
      path: "/citizen",
      parent: "Organizasyon Yönetimi",
    },
    {
      title: "Birim Yönetimi",
      path: "/organization",
      parent: "Organizasyon Yönetimi",
    },
    { title: "Rol Yönetimi", path: "/role", parent: "Organizasyon Yönetimi" },
  ];

  // Filtrelenmiş menü öğeleri
  filteredMenuItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];

    return this.allMenuItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.parent?.toLowerCase().includes(query),
    );
  });

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch(): void {
    this.searchQuery.set("");
  }

  onSearchFocus(): void {
    this.isSearchFocused.set(true);
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.isSearchFocused.set(false);
    }, 200);
  }

  onResultClick(): void {
    this.clearSearch();
    this.isSearchFocused.set(false);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      const results = this.filteredMenuItems();
      if (results.length === 1) {
        this.router.navigate([results[0].path]);
        this.clearSearch();
        // Input'tan focus'u kaldır
        (event.target as HTMLInputElement).blur();
      }
    }
  }
}
