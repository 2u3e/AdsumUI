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

import { MenuService } from "../../core/services/menu.service";
import { PermissionService } from "../../core/services/permission.service";
import { ReferenceService } from "../../core/services/reference.service";
import { NotificationService } from "../../core/services/notification.service";
import { MetronicInitService } from "../../core/services/metronic-init.service";
import { KTSelectService } from "../../core/services/kt-select.service";
import { MenuListItem, MenuTypes } from "../../core/models/menu.models";
import { PermissionListItem } from "../../core/models/permission.models";
import { ReferenceDataSelectItem } from "../../core/models/reference.models";
import { PaginationMeta } from "../../core/models/api.models";
import { OffcanvasFilterComponent } from "../../shared/components/offcanvas-filter/offcanvas-filter.component";
import {
  FilterDrawerConfig,
  FilterValues,
} from "../../shared/components/filter-drawer/filter-config.interface";
import { MENU_FILTER_CONFIG } from "./menu-filter.config";

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [CommonModule, FormsModule, OffcanvasFilterComponent],
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss"],
})
export class MenuComponent implements OnInit, AfterViewChecked, OnDestroy {
  private menuService = inject(MenuService);
  private permissionService = inject(PermissionService);
  private referenceService = inject(ReferenceService);
  private notificationService = inject(NotificationService);
  private metronicInit = inject(MetronicInitService);
  private ktSelectService = inject(KTSelectService);

  // Enum reference for template
  MenuTypes = MenuTypes;

  // Reference ID for menu types
  private readonly MENU_TYPES_REFERENCE_ID = 114;

  // Signals
  menus = signal<MenuListItem[]>([]);
  parentMenus = signal<MenuListItem[]>([]);
  permissions = signal<PermissionListItem[]>([]);
  menuTypes = signal<ReferenceDataSelectItem[]>([]);
  pagination = signal<PaginationMeta | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  deleteModalOpen = signal<boolean>(false);
  createModalOpen = signal<boolean>(false);
  editModalOpen = signal<boolean>(false);
  selectedMenu = signal<MenuListItem | null>(null);

  // Create form
  createForm = {
    code: signal<string>(""),
    name: signal<string>(""),
    typeId: signal<MenuTypes | null>(null),
    route: signal<string>(""),
    icon: signal<string>(""),
    order: signal<number>(0),
    parentId: signal<string | null>(null),
    description: signal<string>(""),
    isActive: signal<boolean>(true),
    isVisible: signal<boolean>(true),
    permissionIds: signal<number[]>([]),
  };
  createFormSubmitting = signal<boolean>(false);
  createFormTouched = {
    code: signal<boolean>(false),
    name: signal<boolean>(false),
    typeId: signal<boolean>(false),
  };

  // Edit form
  editForm = {
    id: signal<string>(""),
    code: signal<string>(""),
    name: signal<string>(""),
    typeId: signal<MenuTypes | null>(null),
    route: signal<string>(""),
    icon: signal<string>(""),
    order: signal<number>(0),
    parentId: signal<string | null>(null),
    description: signal<string>(""),
    isActive: signal<boolean>(true),
    isVisible: signal<boolean>(true),
    permissionIds: signal<number[]>([]),
  };
  editFormSubmitting = signal<boolean>(false);
  editFormTouched = {
    code: signal<boolean>(false),
    name: signal<boolean>(false),
    typeId: signal<boolean>(false),
  };

  // Search ve pagination parametreleri
  searchTerm = signal<string>("");
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Filter offcanvas
  filterDrawerConfig = signal<FilterDrawerConfig>(MENU_FILTER_CONFIG);
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
  activeCount = computed(() => this.menus().filter((m) => m.isActive).length);

  // Pagination display info
  displayFrom = computed(() => {
    if (this.menus().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  displayTo = computed(() => {
    const menusLength = this.menus().length;
    if (menusLength === 0) return 0;

    const from = this.displayFrom();
    return from + menusLength - 1;
  });

  displayTotal = computed(() => {
    const total = this.totalCount();
    if (total === 0 && this.menus().length > 0) {
      return this.menus().length;
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
        this.loadMenus();
      });

    // Üst menü listesini yükle
    this.loadParentMenus();

    // Permission listesini yükle
    this.loadPermissions();

    // Menü tiplerini yükle
    this.loadMenuTypes();

    // İlk yükleme
    this.loadMenus();

    // Initialize select and tooltip components after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.metronicInit.initSelect();
      this.metronicInit.initTooltips();
    }, 100);
  }

  ngAfterViewChecked(): void {
    // Initialize create modal selects only once when modal is open
    if (this.createModalOpen() && !this.createModalSelectsInitialized) {
      const createModalParentSelect = document.getElementById(
        "createModalParentId",
      );

      if (createModalParentSelect) {
        setTimeout(() => {
          this.metronicInit.initSelect();
          this.createModalSelectsInitialized = true;
        }, 0);
      }
    }

    // Initialize edit modal selects only once when modal is open
    if (this.editModalOpen() && !this.editModalSelectsInitialized) {
      const editModalParentSelect =
        document.getElementById("editModalParentId");

      if (editModalParentSelect) {
        setTimeout(() => {
          this.metronicInit.initSelect();
          this.editModalSelectsInitialized = true;
        }, 0);
      }
    }
  }

  /**
   * Üst menü listesini yükler
   */
  loadParentMenus(): void {
    this.menuService.getAllPaged({ pageSize: 1000 }).subscribe({
      next: (response) => {
        this.parentMenus.set(response.data ?? []);
        this.updateFilterDrawerOptions();
      },
      error: (err) => {
        console.error("Parent menus loading error:", err);
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
   * Menü tiplerini reference data'dan yükler
   */
  loadMenuTypes(): void {
    this.referenceService
      .getDataForSelect(this.MENU_TYPES_REFERENCE_ID.toString())
      .subscribe({
        next: (response) => {
          this.menuTypes.set(response.data ?? []);
          this.updateFilterDrawerOptions();
        },
        error: (err) => {
          console.error("Menu types loading error:", err);
        },
      });
  }

  /**
   * Update filter drawer options with loaded data
   */
  updateFilterDrawerOptions(): void {
    // Deep clone the config to ensure Angular detects changes
    const config: FilterDrawerConfig = {
      ...MENU_FILTER_CONFIG,
      fields: MENU_FILTER_CONFIG.fields.map((field) => ({ ...field })),
    };

    // Update parentId options
    const parentField = config.fields.find((f) => f.key === "parentId");
    if (parentField && this.parentMenus().length > 0) {
      parentField.options = this.parentMenus().map((menu) => ({
        id: menu.id,
        name: menu.name,
      }));
    }

    // Update menuType options
    const menuTypeField = config.fields.find((f) => f.key === "menuType");
    if (menuTypeField && this.menuTypes().length > 0) {
      menuTypeField.options = this.menuTypes().map((type) => ({
        id: type.id.toString(),
        name: type.name,
      }));
    }

    this.filterDrawerConfig.set(config);
  }

  /**
   * Menu verilerini yükler
   */
  loadMenus(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.activeFilters();

    this.menuService
      .getAllPaged({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        code: filters["code"] || undefined,
        name: filters["name"] || this.searchTerm() || undefined,
        parentId: filters["parentId"] || undefined,
        menuType: filters["menuType"] ? Number(filters["menuType"]) : undefined,
        isActive:
          filters["isActive"] === "true"
            ? true
            : filters["isActive"] === "false"
              ? false
              : undefined,
        isVisible:
          filters["isVisible"] === "true"
            ? true
            : filters["isVisible"] === "false"
              ? false
              : undefined,
      })
      .subscribe({
        next: (response) => {
          this.menus.set(response.data ?? []);

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
          console.error("Menu loading error:", err);
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
    this.loadMenus();
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
    this.loadMenus();
  }

  /**
   * Yenile
   */
  refresh(): void {
    this.loadMenus();
  }

  /**
   * Menu düzenle - Önce detayları al, sonra modal aç
   */
  onEditMenu(menu: MenuListItem): void {
    this.selectedMenu.set(menu);

    // Detaylı bilgi için API'den tam veriyi çek
    this.menuService.getById(menu.id).subscribe({
      next: (response) => {
        const menuData = response.data;
        if (menuData) {
          this.editForm.id.set(menuData.id);
          this.editForm.code.set(menuData.code);
          this.editForm.name.set(menuData.name);
          this.editForm.typeId.set(menuData.typeId);
          this.editForm.route.set(menuData.route ?? "");
          this.editForm.icon.set(menuData.icon ?? "");
          this.editForm.order.set(menuData.order);
          this.editForm.parentId.set(menuData.parentId ?? null);
          this.editForm.description.set(menuData.description ?? "");
          this.editForm.isActive.set(menuData.isActive);
          this.editForm.isVisible.set(menuData.isVisible);
          this.editForm.permissionIds.set(menuData.permissionIds ?? []);
          this.editModalOpen.set(true);

          // Update KT Select UI after values are set
          setTimeout(() => {
            this.updateEditModalSelectUI();
          }, 100);
        }
      },
      error: (err) => {
        this.error.set(
          "Menü bilgileri yüklenirken hata oluştu: " + err.message,
        );
        console.error("Load menu error:", err);
      },
    });
  }

  /**
   * Menu sil - Modal aç
   */
  deleteMenu(menu: MenuListItem): void {
    this.selectedMenu.set(menu);
    this.deleteModalOpen.set(true);
  }

  /**
   * Delete modal kapat
   */
  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.selectedMenu.set(null);
  }

  /**
   * Silme işlemini onayla
   */
  confirmDelete(): void {
    const menu = this.selectedMenu();
    if (!menu) return;

    this.menuService.deleteById(menu.id).subscribe({
      next: () => {
        this.notificationService.success(
          "Menü başarıyla silindi",
          "Silme İşlemi",
        );
        this.closeDeleteModal();
        this.loadMenus();
        this.loadParentMenus();
      },
      error: (err) => {
        console.error("Delete error:", err);
        this.closeDeleteModal();
      },
    });
  }

  /**
   * Yeni menu ekle - Modal aç
   */
  onAddMenu(): void {
    this.resetCreateForm();
    this.createModalOpen.set(true);
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
    this.createForm.code.set("");
    this.createForm.name.set("");
    // Set first menu type as default if available
    const firstMenuType = this.menuTypes()[0];
    this.createForm.typeId.set(firstMenuType ? Number(firstMenuType.id) : null);
    this.createForm.route.set("");
    this.createForm.icon.set("");
    this.createForm.order.set(0);
    this.createForm.parentId.set(null);
    this.createForm.description.set("");
    this.createForm.isActive.set(true);
    this.createForm.isVisible.set(true);
    this.createForm.permissionIds.set([]);
    this.createFormSubmitting.set(false);
    this.createFormTouched.code.set(false);
    this.createFormTouched.name.set(false);
    this.createFormTouched.typeId.set(false);
  }

  /**
   * Create formuna permission ekle
   */
  addCreatePermission(permissionId: number): void {
    const currentPermissions = this.createForm.permissionIds();
    if (!currentPermissions.includes(permissionId)) {
      this.createForm.permissionIds.set([...currentPermissions, permissionId]);
    }
  }

  /**
   * Create formundan permission kaldır
   */
  removeCreatePermission(permissionId: number): void {
    const currentPermissions = this.createForm.permissionIds();
    this.createForm.permissionIds.set(
      currentPermissions.filter((id) => id !== permissionId),
    );
  }

  /**
   * Create formunda permission seçili mi kontrol et
   */
  isCreatePermissionSelected(permissionId: number): boolean {
    return this.createForm.permissionIds().includes(permissionId);
  }

  /**
   * Menü adı ve üst menüden otomatik kod oluştur
   */
  updateCreateMenuCode(): void {
    const name = this.createForm.name().trim();
    const parentId = this.createForm.parentId();

    if (!name) {
      this.createForm.code.set("");
      return;
    }

    // Türkçe karakterleri İngilizce karşılıklarına çevir
    const turkishMap: { [key: string]: string } = {
      ç: "c",
      Ç: "C",
      ğ: "g",
      Ğ: "G",
      ı: "i",
      İ: "I",
      ö: "o",
      Ö: "O",
      ş: "s",
      Ş: "S",
      ü: "u",
      Ü: "U",
    };

    let code = name;

    // Türkçe karakterleri dönüştür
    Object.keys(turkishMap).forEach((key) => {
      code = code.replace(new RegExp(key, "g"), turkishMap[key]);
    });

    // Sadece harf, rakam ve boşluk bırak, diğerlerini kaldır
    code = code.replace(/[^a-zA-Z0-9\s]/g, "");

    // Boşlukları alt çizgi ile değiştir
    code = code.replace(/\s+/g, "_");

    // Büyük harfe çevir
    code = code.toUpperCase();

    // Üst menü varsa, onun kodunu da ekle
    if (parentId) {
      const parentMenu = this.parentMenus().find((m) => m.id === parentId);
      if (parentMenu && parentMenu.code) {
        code = `${parentMenu.code}_${code}`;
      }
    }

    this.createForm.code.set(code);
  }

  /**
   * Form validation
   */
  isCreateFormValid(): boolean {
    const code = this.createForm.code().trim();
    const name = this.createForm.name().trim();
    const typeId = this.createForm.typeId();

    // Zorunlu alanlar
    if (code.length === 0 || name.length === 0 || !typeId) {
      return false;
    }

    return true;
  }

  /**
   * Field-level validation methods for create form
   */
  isCreateCodeValid(): boolean {
    return this.createForm.code().trim().length > 0;
  }

  isCreateNameValid(): boolean {
    return this.createForm.name().trim().length > 0;
  }

  isCreateTypeIdValid(): boolean {
    return (
      this.createForm.typeId() !== null &&
      this.createForm.typeId() !== undefined
    );
  }

  shouldShowCreateCodeError(): boolean {
    return this.createFormTouched.code() && !this.isCreateCodeValid();
  }

  shouldShowCreateNameError(): boolean {
    return this.createFormTouched.name() && !this.isCreateNameValid();
  }

  shouldShowCreateTypeIdError(): boolean {
    return this.createFormTouched.typeId() && !this.isCreateTypeIdValid();
  }

  getCreateCodeError(): string {
    if (!this.isCreateCodeValid()) {
      return "Menü kodu zorunludur";
    }
    return "";
  }

  getCreateNameError(): string {
    if (!this.isCreateNameValid()) {
      return "Menü adı zorunludur";
    }
    return "";
  }

  getCreateTypeIdError(): string {
    if (!this.isCreateTypeIdValid()) {
      return "Menü tipi zorunludur";
    }
    return "";
  }

  /**
   * Yeni menu oluştur
   */
  submitCreateForm(): void {
    // Mark all fields as touched to show validation errors
    this.createFormTouched.code.set(true);
    this.createFormTouched.name.set(true);
    this.createFormTouched.typeId.set(true);

    if (!this.isCreateFormValid() || this.createFormSubmitting()) {
      return;
    }

    this.createFormSubmitting.set(true);

    const typeId = this.createForm.typeId();
    if (typeId === null) {
      this.createFormSubmitting.set(false);
      return;
    }

    const request = {
      code: this.createForm.code().trim(),
      name: this.createForm.name().trim(),
      typeId: typeId,
      route: this.createForm.route().trim() || undefined,
      icon: this.createForm.icon().trim() || undefined,
      order: this.createForm.order(),
      parentId: this.createForm.parentId() || undefined,
      description: this.createForm.description().trim() || undefined,
      isActive: this.createForm.isActive(),
      isVisible: this.createForm.isVisible(),
      permissionIds:
        this.createForm.permissionIds().length > 0
          ? this.createForm.permissionIds()
          : null,
    };

    this.menuService.create(request).subscribe({
      next: () => {
        this.notificationService.success(
          "Menü başarıyla oluşturuldu",
          "İşlem Başarılı",
        );
        this.closeCreateModal();
        this.loadMenus();
        this.loadParentMenus();
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
    this.selectedMenu.set(null);
    this.resetEditForm();
  }

  /**
   * Menü adı ve üst menüden otomatik kod oluştur (Edit için)
   */
  updateEditMenuCode(): void {
    const name = this.editForm.name().trim();
    const parentId = this.editForm.parentId();

    if (!name) {
      this.editForm.code.set("");
      return;
    }

    // Türkçe karakterleri İngilizce karşılıklarına çevir
    const turkishMap: { [key: string]: string } = {
      ç: "c",
      Ç: "C",
      ğ: "g",
      Ğ: "G",
      ı: "i",
      İ: "I",
      ö: "o",
      Ö: "O",
      ş: "s",
      Ş: "S",
      ü: "u",
      Ü: "U",
    };

    let code = name;

    // Türkçe karakterleri dönüştür
    Object.keys(turkishMap).forEach((key) => {
      code = code.replace(new RegExp(key, "g"), turkishMap[key]);
    });

    // Sadece harf, rakam ve boşluk bırak, diğerlerini kaldır
    code = code.replace(/[^a-zA-Z0-9\s]/g, "");

    // Boşlukları alt çizgi ile değiştir
    code = code.replace(/\s+/g, "_");

    // Büyük harfe çevir
    code = code.toUpperCase();

    // Üst menü varsa, onun kodunu da ekle
    if (parentId) {
      const parentMenu = this.parentMenus().find((m) => m.id === parentId);
      if (parentMenu && parentMenu.code) {
        code = `${parentMenu.code}_${code}`;
      }
    }

    this.editForm.code.set(code);
  }

  /**
   * Edit form resetle
   */
  resetEditForm(): void {
    this.editForm.id.set("");
    this.editForm.code.set("");
    this.editForm.name.set("");
    this.editForm.typeId.set(null);
    this.editForm.route.set("");
    this.editForm.icon.set("");
    this.editForm.order.set(0);
    this.editForm.parentId.set(null);
    this.editForm.description.set("");
    this.editForm.isActive.set(true);
    this.editForm.isVisible.set(true);
    this.editForm.permissionIds.set([]);
    this.editFormSubmitting.set(false);
    this.editFormTouched.code.set(false);
    this.editFormTouched.name.set(false);
    this.editFormTouched.typeId.set(false);
  }

  /**
   * Edit formuna permission ekle
   */
  addEditPermission(permissionId: number): void {
    const currentPermissions = this.editForm.permissionIds();
    if (!currentPermissions.includes(permissionId)) {
      this.editForm.permissionIds.set([...currentPermissions, permissionId]);
    }
  }

  /**
   * Edit formundan permission kaldır
   */
  removeEditPermission(permissionId: number): void {
    const currentPermissions = this.editForm.permissionIds();
    this.editForm.permissionIds.set(
      currentPermissions.filter((id) => id !== permissionId),
    );
  }

  /**
   * Edit formunda permission seçili mi kontrol et
   */
  isEditPermissionSelected(permissionId: number): boolean {
    return this.editForm.permissionIds().includes(permissionId);
  }

  /**
   * Edit form validation
   */
  isEditFormValid(): boolean {
    const code = this.editForm.code().trim();
    const name = this.editForm.name().trim();
    const id = this.editForm.id();
    const typeId = this.editForm.typeId();

    return (
      id.length > 0 &&
      code.length > 0 &&
      name.length > 0 &&
      typeId !== null &&
      typeId !== undefined
    );
  }

  /**
   * Field-level validation methods for edit form
   */
  isEditCodeValid(): boolean {
    return this.editForm.code().trim().length > 0;
  }

  isEditNameValid(): boolean {
    return this.editForm.name().trim().length > 0;
  }

  isEditTypeIdValid(): boolean {
    return (
      this.editForm.typeId() !== null && this.editForm.typeId() !== undefined
    );
  }

  shouldShowEditCodeError(): boolean {
    return this.editFormTouched.code() && !this.isEditCodeValid();
  }

  shouldShowEditNameError(): boolean {
    return this.editFormTouched.name() && !this.isEditNameValid();
  }

  shouldShowEditTypeIdError(): boolean {
    return this.editFormTouched.typeId() && !this.isEditTypeIdValid();
  }

  getEditCodeError(): string {
    if (!this.isEditCodeValid()) {
      return "Menü kodu zorunludur";
    }
    return "";
  }

  getEditNameError(): string {
    if (!this.isEditNameValid()) {
      return "Menü adı zorunludur";
    }
    return "";
  }

  getEditTypeIdError(): string {
    if (!this.isEditTypeIdValid()) {
      return "Menü tipi zorunludur";
    }
    return "";
  }

  /**
   * Menu güncelle
   */
  submitEditForm(): void {
    // Mark all fields as touched to show validation errors
    this.editFormTouched.code.set(true);
    this.editFormTouched.name.set(true);
    this.editFormTouched.typeId.set(true);

    if (!this.isEditFormValid() || this.editFormSubmitting()) {
      return;
    }

    this.editFormSubmitting.set(true);

    const typeId = this.editForm.typeId();
    if (typeId === null) {
      this.editFormSubmitting.set(false);
      return;
    }

    const request = {
      id: this.editForm.id(),
      code: this.editForm.code().trim(),
      name: this.editForm.name().trim(),
      typeId: typeId,
      route: this.editForm.route().trim() || undefined,
      icon: this.editForm.icon().trim() || undefined,
      order: this.editForm.order(),
      parentId: this.editForm.parentId() || undefined,
      description: this.editForm.description().trim() || undefined,
      isActive: this.editForm.isActive(),
      isVisible: this.editForm.isVisible(),
      permissionIds:
        this.editForm.permissionIds().length > 0
          ? this.editForm.permissionIds()
          : null,
    };

    this.menuService.update(request.id, request).subscribe({
      next: () => {
        this.notificationService.success(
          "Menü başarıyla güncellendi",
          "Güncelleme Başarılı",
        );
        this.closeEditModal();
        this.loadMenus();
        this.loadParentMenus();
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
    this.loadMenus();
  }

  /**
   * Handle filter clear from offcanvas
   */
  onFiltersCleared(): void {
    this.activeFilters.set({});
    this.currentPage.set(1);
    this.loadMenus();
  }

  /**
   * Clear all filters and search from main page
   */
  clearAllFilters(): void {
    this.activeFilters.set({});
    this.searchTerm.set("");
    this.currentPage.set(1);
    this.loadMenus();
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
    const selectIds = ["editModalParentId"];

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
   * Get menu type name from reference data
   */
  getMenuTypeName(typeId: MenuTypes | number): string {
    const menuType = this.menuTypes().find(
      (type) => Number(type.id) === Number(typeId),
    );
    return menuType ? menuType.name : "Bilinmeyen";
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    // Destroy KT Select instances for modals
    this.ktSelectService.destroyInstances(
      "createModalParentId",
      "editModalParentId",
    );
  }
}
