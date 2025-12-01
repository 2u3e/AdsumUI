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
    {
      title: "İş Tipi Yönetimi",
      path: "/work-type",
      parent: "İş Emri Yönetimi",
    },
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

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      const results = this.filteredMenuItems();
      if (results.length === 1) {
        // Önce tüm açık menüleri kapat
        this.closeAllMenus();
        this.router.navigate([results[0].path]);
        this.clearSearch();
        (event.target as HTMLInputElement).blur();
        setTimeout(() => this.expandMenuForPath(results[0].path), 100);
      }
    }
  }

  private closeAllMenus(): void {
    const openMenus = document.querySelectorAll(
      "#sidebar_menu .kt-menu-item-show",
    );
    openMenus.forEach((menu) => {
      menu.classList.remove("kt-menu-item-show");
      const accordion = menu.querySelector(
        ":scope > .kt-menu-accordion",
      ) as HTMLElement;
      if (accordion) {
        accordion.style.display = "";
      }
    });
  }

  onResultClick(path: string): void {
    // Önce tüm açık menüleri kapat
    this.closeAllMenus();
    this.clearSearch();
    this.isSearchFocused.set(false);
    setTimeout(() => this.expandMenuForPath(path), 100);
  }

  private expandMenuForPath(path: string): void {
    // routerLinkActive class'ı ile aktif linki bul
    setTimeout(() => {
      const activeLink = document.querySelector(
        "#sidebar_menu a.kt-menu-item-active",
      ) as HTMLElement;

      if (activeLink) {
        this.expandParentMenus(activeLink);
      }
    }, 50);
  }

  private expandParentMenus(element: HTMLElement): void {
    // Önce tüm açık menüleri kapat
    this.closeAllMenus();

    // Üst accordion'ları bul ve aç (en içten dışa)
    const menuItems: HTMLElement[] = [];
    let parent = element.closest(".kt-menu-accordion");

    while (parent) {
      const menuItem = parent.closest(".kt-menu-item") as HTMLElement;
      if (menuItem) {
        menuItems.push(menuItem);
      }
      parent = menuItem?.parentElement?.closest(".kt-menu-accordion") || null;
    }

    // Dıştan içe doğru aç - class ekleyerek
    menuItems.reverse().forEach((menuItem) => {
      if (!menuItem.classList.contains("kt-menu-item-show")) {
        menuItem.classList.add("kt-menu-item-show");
        // Accordion içeriğini göster
        const accordion = menuItem.querySelector(
          ":scope > .kt-menu-accordion",
        ) as HTMLElement;
        if (accordion) {
          accordion.style.display = "flex";
        }
      }
    });
  }
}
