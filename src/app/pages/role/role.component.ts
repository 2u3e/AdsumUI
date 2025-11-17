import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  AfterViewChecked,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, debounceTime, distinctUntilChanged } from "rxjs";

import { RoleService } from "../../core/services/role.service";
import { MenuService } from "../../core/services/menu.service";
import { PermissionService } from "../../core/services/permission.service";
import { MenuPermissionService } from "../../core/services/menu-permission.service";
import { NotificationService } from "../../core/services/notification.service";
import { MetronicInitService } from "../../core/services/metronic-init.service";
import { KTSelectService } from "../../core/services/kt-select.service";
import { RoleListItem } from "../../core/models/role.models";
import { MenuListItem } from "../../core/models/menu.models";
import { PermissionListItem } from "../../core/models/permission.models";
import { GetMenuTreeWithPermissionsResponse } from "../../core/models/menu-permission.models";
import { PaginationMeta } from "../../core/models/api.models";
import { OffcanvasFilterComponent } from "../../shared/components/offcanvas-filter/offcanvas-filter.component";
import {
  FilterDrawerConfig,
  FilterValues,
} from "../../shared/components/filter-drawer/filter-config.interface";
import { ROLE_FILTER_CONFIG } from "./role-filter.config";

@Component({
  selector: "app-role",
  standalone: true,
  imports: [CommonModule, FormsModule, OffcanvasFilterComponent],
  templateUrl: "./role.component.html",
  styleUrls: ["./role.component.scss"],
})
export class RoleComponent implements OnInit, AfterViewChecked, OnDestroy {
  private roleService = inject(RoleService);
  private menuService = inject(MenuService);
  private permissionService = inject(PermissionService);
  private menuPermissionService = inject(MenuPermissionService);
  private notificationService = inject(NotificationService);
  private metronicInit = inject(MetronicInitService);
  private ktSelectService = inject(KTSelectService);

  // Signals
  roles = signal<RoleListItem[]>([]);
  menus = signal<MenuListItem[]>([]);
  permissions = signal<PermissionListItem[]>([]);
  menuTree = signal<GetMenuTreeWithPermissionsResponse[]>([]);
  expandedMenuIds = signal<Set<string>>(new Set());
  pagination = signal<PaginationMeta | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  deleteModalOpen = signal<boolean>(false);
  createModalOpen = signal<boolean>(false);
  editModalOpen = signal<boolean>(false);
  selectedRole = signal<RoleListItem | null>(null);

  // Create form
  createForm = {
    name: signal<string>(""),
    menuPermissionIds: signal<string[]>([]),
  };
  createFormSubmitting = signal<boolean>(false);
  createFormTouched = {
    name: signal<boolean>(false),
  };

  // Edit form
  editForm = {
    id: signal<string>(""),
    name: signal<string>(""),
    menuPermissionIds: signal<string[]>([]),
  };
  editFormSubmitting = signal<boolean>(false);
  editFormTouched = {
    name: signal<boolean>(false),
  };

  // Search ve pagination parametreleri
  searchTerm = signal<string>("");
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Filter offcanvas
  filterDrawerConfig = signal<FilterDrawerConfig>(ROLE_FILTER_CONFIG);
  activeFilters = signal<FilterValues>({});
  filterOffcanvasOpen = signal<boolean>(false);

  // Search debounce için
  private searchSubject = new Subject<string>();

  // Flags to track if modal selects have been initialized
  private createModalSelectsInitialized = false;
  private editModalSelectsInitialized = false;

  // Computed values
  totalPages = computed(() => this.pagination()?.totalPages ?? 0);
  hasNextPage = computed(() => {
    const pagination = this.pagination();
    if (!pagination) return false;
    if (pagination.hasNextPage !== undefined) return pagination.hasNextPage;
    const current =
      pagination.page ?? pagination.currentPage ?? this.currentPage();
    return current < (pagination.totalPages ?? 0);
  });
  hasPreviousPage = computed(() => {
    const pagination = this.pagination();
    if (!pagination) return false;
    if (pagination.hasPreviousPage !== undefined)
      return pagination.hasPreviousPage;
    const current =
      pagination.page ?? pagination.currentPage ?? this.currentPage();
    return current > 1;
  });
  totalCount = computed(() => {
    const pagination = this.pagination();
    if (!pagination) return 0;
    return (
      pagination.totalItems ??
      pagination.totalItem ??
      pagination.totalCount ??
      0
    );
  });
  systemRoleCount = computed(
    () => this.roles().filter((r) => r.isSystem).length,
  );

  // Pagination display info
  displayFrom = computed(() => {
    if (this.roles().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  displayTo = computed(() => {
    const rolesLength = this.roles().length;
    if (rolesLength === 0) return 0;

    const from = this.displayFrom();
    return from + rolesLength - 1;
  });

  displayTotal = computed(() => {
    const total = this.totalCount();
    if (total === 0 && this.roles().length > 0) {
      return this.roles().length;
    }
    return total;
  });

  // Sayfa numaraları için array (pagination buttons)
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 0) return pages;

    pages.push(1);

    if (total <= 5) {
      for (let i = 2; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        pages.push(2, 3, 4);
      } else if (current >= total - 2) {
        pages.push(total - 3, total - 2, total - 1);
      } else {
        pages.push(current - 1, current, current + 1);
      }

      if (!pages.includes(total)) {
        pages.push(total);
      }
    }

    return pages;
  });

  ngOnInit(): void {
    // Search debounce setup
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchTerm.set(searchTerm);
        this.currentPage.set(1);
        this.loadRoles();
      });

    // Menü listesini yükle
    this.loadMenus();

    // Permission listesini yükle
    this.loadPermissions();

    // Menu tree yükle
    this.loadMenuTree();

    // İlk yükleme
    this.loadRoles();

    // Initialize select and tooltip components after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.metronicInit.initSelect();
      this.metronicInit.initTooltips();
    }, 100);
  }

  ngAfterViewChecked(): void {
    // Initialize create modal selects only once when modal is open
    if (this.createModalOpen() && !this.createModalSelectsInitialized) {
      const createModalMenuSelect =
        document.getElementById("createModalMenuIds");

      if (createModalMenuSelect) {
        setTimeout(() => {
          this.metronicInit.initSelect();
          this.createModalSelectsInitialized = true;
        }, 0);
      }
    }

    // Initialize edit modal selects only once when modal is open
    if (this.editModalOpen() && !this.editModalSelectsInitialized) {
      const editModalMenuSelect = document.getElementById("editModalMenuIds");

      if (editModalMenuSelect) {
        setTimeout(() => {
          this.metronicInit.initSelect();
          this.editModalSelectsInitialized = true;
        }, 0);
      }
    }
  }

  /**
   * Menü listesini yükler
   */
  loadMenus(): void {
    this.menuService.getAllPaged({ pageSize: 1000 }).subscribe({
      next: (response) => {
        this.menus.set(response.data ?? []);
      },
      error: (err) => {
        console.error("Menus loading error:", err);
      },
    });
  }

  /**
   * Permission listesini yükler
   */
  loadPermissions(): void {
    this.permissionService
      .getAllPaged({ pageSize: 1000, isActive: true })
      .subscribe({
        next: (response) => {
          this.permissions.set(response.data ?? []);
        },
        error: (err) => {
          console.error("Permissions loading error:", err);
        },
      });
  }

  /**
   * Menu tree yükler
   */
  loadMenuTree(): void {
    this.menuPermissionService.getMenuTree().subscribe({
      next: (response) => {
        this.menuTree.set(response.data ?? []);
        // İlk açıldığında menülere kadar aç, permissionlar kapalı kalsın
        this.expandMenuTreeToMenuLevel(response.data ?? []);
      },
      error: (err) => {
        console.error("Menu tree loading error:", err);
      },
    });
  }

  /**
   * Menü ağacını menü seviyesine kadar aç (permissionlar kapalı)
   */
  private expandMenuTreeToMenuLevel(
    menuItems: GetMenuTreeWithPermissionsResponse[],
  ): void {
    const expanded = new Set<string>();

    // Level 1 (Folders) - açık olsun
    menuItems.forEach((item) => {
      if (
        (item.children?.length || 0) > 0 ||
        (item.permissions?.length || 0) > 0
      ) {
        expanded.add(item.id);
      }

      // Level 2 (Menus) - açık olsun ama permissionlar kapalı
      item.children?.forEach((child) => {
        // Menüleri aç ama içinde permission varsa onları kapalı tut
        // Burada sadece folder olup olmadığını kontrol ediyoruz
        // Eğer child'ın da child'ı varsa (yani alt menü varsa) aç
        if ((child.children?.length || 0) > 0) {
          expanded.add(child.id);
        }
        // Eğer sadece permission varsa kapalı bırak
      });
    });

    this.expandedMenuIds.set(expanded);
  }

  /**
   * Rol verilerini yükler
   */
  loadRoles(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.activeFilters();

    this.roleService
      .getAllPaged({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        name: filters["name"] || this.searchTerm() || undefined,
        isSystem:
          filters["isSystem"] === "true"
            ? true
            : filters["isSystem"] === "false"
              ? false
              : undefined,
      })
      .subscribe({
        next: (response) => {
          this.roles.set(response.data ?? []);

          if (response.pagination) {
            this.pagination.set(response.pagination);
          } else if (response.data && response.data.length > 0) {
            this.pagination.set({
              currentPage: this.currentPage(),
              pageSize: this.pageSize(),
              totalCount: response.data.length,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            });
          }

          this.loading.set(false);

          // Reinitialize tooltips after data loads
          setTimeout(() => {
            this.metronicInit.initTooltips();
          }, 100);
        },
        error: (err) => {
          this.error.set(err.message || "Veriler yüklenirken bir hata oluştu");
          this.loading.set(false);
          console.error("Role loading error:", err);
        },
      });
  }

  /**
   * Search input değiştiğinde
   */
  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  /**
   * Sayfa değiştiğinde
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadRoles();
  }

  /**
   * Önceki sayfaya git
   */
  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Sonraki sayfaya git
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Sayfa boyutu değiştiğinde
   */
  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadRoles();
  }

  /**
   * Yenile
   */
  refresh(): void {
    this.loadRoles();
  }

  /**
   * Rol düzenle - Önce detayları al, sonra modal aç
   */
  onEditRole(role: RoleListItem): void {
    this.selectedRole.set(role);

    // Detaylı bilgi için API'den tam veriyi çek
    this.roleService.getById(role.id).subscribe({
      next: (response) => {
        const roleData = response.data;
        if (roleData) {
          this.editForm.id.set(roleData.id);
          this.editForm.name.set(roleData.name);
          this.editForm.menuPermissionIds.set(roleData.menuPermissionIds ?? []);
          this.editModalOpen.set(true);

          // Update KT Select UI after values are set
          setTimeout(() => {
            this.updateEditModalSelectUI();
          }, 100);
        }
      },
      error: (err) => {
        this.error.set("Rol bilgileri yüklenirken hata oluştu: " + err.message);
        console.error("Load role error:", err);
      },
    });
  }

  /**
   * Rol sil - Modal aç
   */
  deleteRole(role: RoleListItem): void {
    this.selectedRole.set(role);
    this.deleteModalOpen.set(true);
  }

  /**
   * Delete modal kapat
   */
  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.selectedRole.set(null);
  }

  /**
   * Silme işlemini onayla
   */
  confirmDelete(): void {
    const role = this.selectedRole();
    if (!role) return;

    this.roleService.deleteById(role.id).subscribe({
      next: () => {
        this.notificationService.success(
          "Rol başarıyla silindi",
          "Silme İşlemi",
        );
        this.closeDeleteModal();
        this.loadRoles();
      },
      error: (err) => {
        console.error("Delete error:", err);
        this.closeDeleteModal();
      },
    });
  }

  /**
   * Yeni rol ekle - Modal aç
   */
  onAddRole(): void {
    this.resetCreateForm();
    this.createModalOpen.set(true);
  }

  /**
   * Menü expand/collapse toggle
   */
  toggleMenuExpand(menuId: string): void {
    const expanded = this.expandedMenuIds();
    const newSet = new Set(expanded);
    if (newSet.has(menuId)) {
      newSet.delete(menuId);
    } else {
      newSet.add(menuId);
    }
    this.expandedMenuIds.set(newSet);
  }

  /**
   * Menü expanded mi kontrol et
   */
  isMenuExpanded(menuId: string): boolean {
    return this.expandedMenuIds().has(menuId);
  }

  /**
   * Create modal kapat
   */
  closeCreateModal(): void {
    this.createModalOpen.set(false);
    this.createModalSelectsInitialized = false;
    this.resetCreateForm();
  }

  /**
   * Create form resetle
   */
  resetCreateForm(): void {
    this.createForm.name.set("");
    this.createForm.menuPermissionIds.set([]);
    this.createFormSubmitting.set(false);
    this.createFormTouched.name.set(false);
  }

  /**
   * Create formuna menuPermission ekle
   */
  addCreateMenuPermission(menuPermissionId: string): void {
    const current = this.createForm.menuPermissionIds();
    if (!current.includes(menuPermissionId)) {
      this.createForm.menuPermissionIds.set([...current, menuPermissionId]);
    }
  }

  /**
   * Create formundan menuPermission kaldır
   */
  removeCreateMenuPermission(menuPermissionId: string): void {
    const current = this.createForm.menuPermissionIds();
    this.createForm.menuPermissionIds.set(
      current.filter((id) => id !== menuPermissionId),
    );
  }

  /**
   * Create formunda menuPermission seçili mi kontrol et
   */
  isCreateMenuPermissionSelected(menuPermissionId: string): boolean {
    return this.createForm.menuPermissionIds().includes(menuPermissionId);
  }

  /**
   * Toggle menuPermission seçimini (create form)
   */
  toggleCreateMenuPermission(menuPermissionId: string): void {
    if (this.isCreateMenuPermissionSelected(menuPermissionId)) {
      this.removeCreateMenuPermission(menuPermissionId);
    } else {
      this.addCreateMenuPermission(menuPermissionId);
    }
  }

  /**
   * Bir menü ve tüm alt menülerindeki permission ID'lerini topla
   */
  getAllMenuPermissionIds(
    menuItem: GetMenuTreeWithPermissionsResponse,
  ): string[] {
    let ids: string[] = [];

    // Bu menünün kendi permission'ları
    if (menuItem.permissions) {
      ids.push(...menuItem.permissions.map((p) => p.menuPermissionId));
    }

    // Alt menülerin permission'ları (recursive)
    if (menuItem.children) {
      for (const child of menuItem.children) {
        ids.push(...this.getAllMenuPermissionIds(child));
      }
    }

    return ids;
  }

  /**
   * Menü için checkbox durumunu kontrol et (create form)
   * Returns: 'checked' | 'indeterminate' | 'unchecked'
   */
  getCreateMenuCheckboxState(
    menuItem: GetMenuTreeWithPermissionsResponse,
  ): "checked" | "indeterminate" | "unchecked" {
    const allPermissionIds = this.getAllMenuPermissionIds(menuItem);
    if (allPermissionIds.length === 0) return "unchecked";

    const selectedIds = this.createForm.menuPermissionIds();
    const selectedCount = allPermissionIds.filter((id) =>
      selectedIds.includes(id),
    ).length;

    if (selectedCount === 0) return "unchecked";
    if (selectedCount === allPermissionIds.length) return "checked";
    return "indeterminate";
  }

  /**
   * Menü checkbox'ını toggle et (create form)
   */
  toggleCreateMenu(menuItem: GetMenuTreeWithPermissionsResponse): void {
    const allPermissionIds = this.getAllMenuPermissionIds(menuItem);
    const currentState = this.getCreateMenuCheckboxState(menuItem);

    if (currentState === "checked") {
      // Tümünü kaldır
      const current = this.createForm.menuPermissionIds();
      this.createForm.menuPermissionIds.set(
        current.filter((id) => !allPermissionIds.includes(id)),
      );
    } else {
      // Tümünü ekle
      const current = this.createForm.menuPermissionIds();
      const newIds = [...current];
      for (const id of allPermissionIds) {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      }
      this.createForm.menuPermissionIds.set(newIds);
    }
  }

  /**
   * Form validation
   */
  isCreateFormValid(): boolean {
    const name = this.createForm.name().trim();

    // Zorunlu alanlar
    if (name.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Field-level validation methods for create form
   */
  isCreateNameValid(): boolean {
    return this.createForm.name().trim().length > 0;
  }

  shouldShowCreateNameError(): boolean {
    return this.createFormTouched.name() && !this.isCreateNameValid();
  }

  getCreateNameError(): string {
    if (!this.isCreateNameValid()) {
      return "Rol adı zorunludur";
    }
    return "";
  }

  /**
   * Yeni rol oluştur
   */
  submitCreateForm(): void {
    // Mark all fields as touched to show validation errors
    this.createFormTouched.name.set(true);

    if (!this.isCreateFormValid() || this.createFormSubmitting()) {
      return;
    }

    this.createFormSubmitting.set(true);

    const request = {
      name: this.createForm.name().trim(),
      menuPermissionIds:
        this.createForm.menuPermissionIds().length > 0
          ? this.createForm.menuPermissionIds()
          : null,
    };

    this.roleService.create(request).subscribe({
      next: () => {
        this.notificationService.success(
          "Rol başarıyla oluşturuldu",
          "İşlem Başarılı",
        );
        this.closeCreateModal();
        this.loadRoles();
      },
      error: (err) => {
        console.error("Create error:", err);
        this.createFormSubmitting.set(false);
      },
    });
  }

  /**
   * Edit modal kapat
   */
  closeEditModal(): void {
    this.editModalOpen.set(false);
    this.editModalSelectsInitialized = false;
    this.selectedRole.set(null);
    this.resetEditForm();
  }

  /**
   * Edit form resetle
   */
  resetEditForm(): void {
    this.editForm.id.set("");
    this.editForm.name.set("");
    this.editForm.menuPermissionIds.set([]);
    this.editFormSubmitting.set(false);
    this.editFormTouched.name.set(false);
  }

  /**
   * Edit formuna menuPermission ekle
   */
  addEditMenuPermission(menuPermissionId: string): void {
    const current = this.editForm.menuPermissionIds();
    if (!current.includes(menuPermissionId)) {
      this.editForm.menuPermissionIds.set([...current, menuPermissionId]);
    }
  }

  /**
   * Edit formundan menuPermission kaldır
   */
  removeEditMenuPermission(menuPermissionId: string): void {
    const current = this.editForm.menuPermissionIds();
    this.editForm.menuPermissionIds.set(
      current.filter((id) => id !== menuPermissionId),
    );
  }

  /**
   * Edit formunda menuPermission seçili mi kontrol et
   */
  isEditMenuPermissionSelected(menuPermissionId: string): boolean {
    return this.editForm.menuPermissionIds().includes(menuPermissionId);
  }

  /**
   * Toggle menuPermission seçimini (edit form)
   */
  toggleEditMenuPermission(menuPermissionId: string): void {
    if (this.isEditMenuPermissionSelected(menuPermissionId)) {
      this.removeEditMenuPermission(menuPermissionId);
    } else {
      this.addEditMenuPermission(menuPermissionId);
    }
  }

  /**
   * Menü için checkbox durumunu kontrol et (edit form)
   * Returns: 'checked' | 'indeterminate' | 'unchecked'
   */
  getEditMenuCheckboxState(
    menuItem: GetMenuTreeWithPermissionsResponse,
  ): "checked" | "indeterminate" | "unchecked" {
    const allPermissionIds = this.getAllMenuPermissionIds(menuItem);
    if (allPermissionIds.length === 0) return "unchecked";

    const selectedIds = this.editForm.menuPermissionIds();
    const selectedCount = allPermissionIds.filter((id) =>
      selectedIds.includes(id),
    ).length;

    if (selectedCount === 0) return "unchecked";
    if (selectedCount === allPermissionIds.length) return "checked";
    return "indeterminate";
  }

  /**
   * Menü checkbox'ını toggle et (edit form)
   */
  toggleEditMenu(menuItem: GetMenuTreeWithPermissionsResponse): void {
    const allPermissionIds = this.getAllMenuPermissionIds(menuItem);
    const currentState = this.getEditMenuCheckboxState(menuItem);

    if (currentState === "checked") {
      // Tümünü kaldır
      const current = this.editForm.menuPermissionIds();
      this.editForm.menuPermissionIds.set(
        current.filter((id) => !allPermissionIds.includes(id)),
      );
    } else {
      // Tümünü ekle
      const current = this.editForm.menuPermissionIds();
      const newIds = [...current];
      for (const id of allPermissionIds) {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      }
      this.editForm.menuPermissionIds.set(newIds);
    }
  }

  /**
   * Edit form validation
   */
  isEditFormValid(): boolean {
    const name = this.editForm.name().trim();
    const id = this.editForm.id();

    return id.length > 0 && name.length > 0;
  }

  /**
   * Field-level validation methods for edit form
   */
  isEditNameValid(): boolean {
    return this.editForm.name().trim().length > 0;
  }

  shouldShowEditNameError(): boolean {
    return this.editFormTouched.name() && !this.isEditNameValid();
  }

  getEditNameError(): string {
    if (!this.isEditNameValid()) {
      return "Rol adı zorunludur";
    }
    return "";
  }

  /**
   * Rol güncelle
   */
  submitEditForm(): void {
    // Mark all fields as touched to show validation errors
    this.editFormTouched.name.set(true);

    if (!this.isEditFormValid() || this.editFormSubmitting()) {
      return;
    }

    this.editFormSubmitting.set(true);

    const request = {
      id: this.editForm.id(),
      name: this.editForm.name().trim(),
      menuPermissionIds:
        this.editForm.menuPermissionIds().length > 0
          ? this.editForm.menuPermissionIds()
          : null,
    };

    this.roleService.update(request.id, request).subscribe({
      next: () => {
        this.notificationService.success(
          "Rol başarıyla güncellendi",
          "Güncelleme Başarılı",
        );
        this.closeEditModal();
        this.loadRoles();
      },
      error: (err) => {
        console.error("Update error:", err);
        this.editFormSubmitting.set(false);
      },
    });
  }

  /**
   * Hata mesajını kapat
   */
  closeError(): void {
    this.error.set(null);
  }

  /**
   * Handle filter apply from offcanvas
   */
  onFiltersApplied(filters: FilterValues): void {
    this.activeFilters.set(filters);
    this.currentPage.set(1);
    this.loadRoles();
  }

  /**
   * Handle filter clear from offcanvas
   */
  onFiltersCleared(): void {
    this.activeFilters.set({});
    this.currentPage.set(1);
    this.loadRoles();
  }

  /**
   * Clear all filters and search from main page
   */
  clearAllFilters(): void {
    this.activeFilters.set({});
    this.searchTerm.set("");
    this.currentPage.set(1);
    this.loadRoles();
  }

  /**
   * Toggle filter offcanvas open/close
   */
  onFilterOffcanvasToggle(isOpen: boolean): void {
    this.filterOffcanvasOpen.set(isOpen);
  }

  /**
   * Open filter offcanvas
   */
  openFilterOffcanvas(): void {
    this.filterOffcanvasOpen.set(true);
  }

  /**
   * Get active filter count for badge display
   */
  getActiveFilterCount(): number {
    const filters = this.activeFilters();
    let count = 0;

    Object.keys(filters).forEach((key) => {
      const value = filters[key];

      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value) && value.length > 0) {
          count++;
        } else if (!Array.isArray(value)) {
          count++;
        }
      }
    });

    return count;
  }

  /**
   * Update KT Select UI for edit modal to reflect current values
   */
  private updateEditModalSelectUI(): void {
    const selectIds = ["editModalMenuIds"];

    selectIds.forEach((selectId) => {
      const element = document.getElementById(selectId) as HTMLSelectElement;

      if (element) {
        // Trigger change event to sync native select with Angular
        element.dispatchEvent(new Event("change", { bubbles: true }));

        // Update KT Select UI using getInstance API
        const KTSelect = (window as any).KTSelect;
        if (KTSelect && typeof KTSelect.getInstance === "function") {
          const ktSelectInstance = KTSelect.getInstance(element);
          if (
            ktSelectInstance &&
            typeof ktSelectInstance.update === "function"
          ) {
            ktSelectInstance.update();
          }
        }
      }
    });
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    // Destroy KT Select instances for modals
    this.ktSelectService.destroyInstances(
      "createModalMenuIds",
      "editModalMenuIds",
    );
  }
}
