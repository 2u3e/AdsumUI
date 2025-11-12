import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  AfterViewChecked,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, debounceTime, distinctUntilChanged } from "rxjs";

import { OrganizationService } from "../../core/services/organization.service";
import { ReferenceService } from "../../core/services/reference.service";
import { NotificationService } from "../../core/services/notification.service";
import { MetronicInitService } from "../../core/services/metronic-init.service";
import {
  OrganizationListItem,
  OrganizationSelectItem,
} from "../../core/models/organization.models";
import { ReferenceDataSelectItem } from "../../core/models/reference.models";
import { ReferenceTypes } from "../../core/constants/reference-types";
import { PaginationMeta } from "../../core/models/api.models";
import { OffcanvasFilterComponent } from "../../shared/components/offcanvas-filter/offcanvas-filter.component";
import {
  FilterDrawerConfig,
  FilterValues,
} from "../../shared/components/filter-drawer/filter-config.interface";
import { ORGANIZATION_FILTER_CONFIG } from "./organization-filter.config";

@Component({
  selector: "app-organization",
  standalone: true,
  imports: [CommonModule, FormsModule, OffcanvasFilterComponent],
  templateUrl: "./organization.component.html",
  styleUrls: ["./organization.component.scss"],
})
export class OrganizationComponent implements OnInit, AfterViewChecked {
  private organizationService = inject(OrganizationService);
  private referenceService = inject(ReferenceService);
  private notificationService = inject(NotificationService);
  private metronicInit = inject(MetronicInitService);

  // Signals
  organizations = signal<OrganizationListItem[]>([]);
  organizationTypes = signal<ReferenceDataSelectItem[]>([]);
  parentOrganizations = signal<OrganizationSelectItem[]>([]);
  pagination = signal<PaginationMeta | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  deleteModalOpen = signal<boolean>(false);
  createModalOpen = signal<boolean>(false);
  editModalOpen = signal<boolean>(false);
  selectedOrganization = signal<OrganizationListItem | null>(null);

  // Create form
  createForm = {
    name: signal<string>(""),
    shortName: signal<string>(""),
    typeId: signal<number | null>(null),
    parentId: signal<string | null>(null),
    description: signal<string>(""),
    isActive: signal<boolean>(true),
  };
  createFormSubmitting = signal<boolean>(false);
  createFormTouched = {
    name: signal<boolean>(false),
    typeId: signal<boolean>(false),
  };

  // Edit form
  editForm = {
    id: signal<string>(""),
    name: signal<string>(""),
    shortName: signal<string>(""),
    typeId: signal<number | null>(null),
    parentId: signal<string | null>(null),
    description: signal<string>(""),
    isActive: signal<boolean>(true),
  };
  editFormSubmitting = signal<boolean>(false);
  editFormTouched = {
    name: signal<boolean>(false),
    typeId: signal<boolean>(false),
  };

  // Search ve pagination parametreleri
  searchTerm = signal<string>("");
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Filter offcanvas
  filterDrawerConfig = signal<FilterDrawerConfig>(ORGANIZATION_FILTER_CONFIG);
  activeFilters = signal<FilterValues>({});
  filterOffcanvasOpen = signal<boolean>(false);

  // Search debounce için
  private searchSubject = new Subject<string>();

  // Flag to track if selects need reinitialization
  private needsSelectInit = false;

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
  activeCount = computed(
    () => this.organizations().filter((o) => o.isActive).length,
  );

  // Pagination display info
  displayFrom = computed(() => {
    if (this.organizations().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  displayTo = computed(() => {
    const organizationsLength = this.organizations().length;
    if (organizationsLength === 0) return 0;

    const from = this.displayFrom();
    return from + organizationsLength - 1;
  });

  displayTotal = computed(() => {
    const total = this.totalCount();
    if (total === 0 && this.organizations().length > 0) {
      return this.organizations().length;
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
        this.loadOrganizations();
      });

    // Organizasyon tipleri listesini yükle
    this.loadOrganizationTypes();

    // Üst organizasyon listesini yükle
    this.loadParentOrganizations();

    // İlk yükleme
    this.loadOrganizations();

    // Initialize select and tooltip components after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.metronicInit.initSelect();
      this.metronicInit.initTooltips();
    }, 100);
  }

  ngAfterViewChecked(): void {
    if (this.needsSelectInit) {
      this.metronicInit.initSelect();
      this.metronicInit.initTooltips();
      this.needsSelectInit = false;
    }
  }

  /**
   * Organizasyon tipleri listesini yükler
   * ReferenceId = 106 (OrganizationType)
   */
  loadOrganizationTypes(): void {
    this.referenceService
      .getDataForSelect(ReferenceTypes.OrganizationType.toString(), false)
      .subscribe({
        next: (response) => {
          this.organizationTypes.set(response.data ?? []);
          this.updateFilterDrawerOptions();
        },
        error: (err) => {
          console.error("Organization types loading error:", err);
        },
      });
  }

  /**
   * Üst organizasyon listesini yükler (select için)
   */
  loadParentOrganizations(): void {
    this.organizationService.getAllForSelect().subscribe({
      next: (response) => {
        this.parentOrganizations.set(response.data ?? []);
        this.updateFilterDrawerOptions();
      },
      error: (err) => {
        console.error("Parent organizations loading error:", err);
      },
    });
  }

  /**
   * Update filter drawer options with loaded data
   */
  updateFilterDrawerOptions(): void {
    // Only update if both data sources are loaded
    if (
      this.organizationTypes().length === 0 ||
      this.parentOrganizations().length === 0
    ) {
      return;
    }

    // Deep clone the config to ensure Angular detects changes
    const config: FilterDrawerConfig = {
      ...ORGANIZATION_FILTER_CONFIG,
      fields: ORGANIZATION_FILTER_CONFIG.fields.map((field) => ({ ...field })),
    };

    // Update parentId options
    const parentField = config.fields.find((f) => f.key === "parentId");
    if (parentField) {
      parentField.options = this.parentOrganizations().map((org) => ({
        id: org.id,
        name: org.name,
      }));
    }

    // Update typeId options
    const typeField = config.fields.find((f) => f.key === "typeId");
    if (typeField) {
      typeField.options = this.organizationTypes().map((type) => ({
        id: type.id,
        name: type.name,
      }));
    }

    this.filterDrawerConfig.set(config);
  }

  /**
   * Organization verilerini yükler
   */
  loadOrganizations(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.activeFilters();

    this.organizationService
      .getAllPaged({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        name: filters["name"] || this.searchTerm() || undefined,
        shortName: filters["shortName"] || undefined,
        typeId: filters["typeId"] ?? undefined,
        parentId: filters["parentId"] || undefined,
      })
      .subscribe({
        next: (response) => {
          this.organizations.set(response.data ?? []);

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
          console.error("Organization loading error:", err);
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
    this.loadOrganizations();
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
    this.loadOrganizations();
  }

  /**
   * Yenile
   */
  refresh(): void {
    this.loadOrganizations();
  }

  /**
   * Organization görüntüle
   */
  onViewOrganization(organization: OrganizationListItem): void {
    console.log("Organization görüntüle:", organization);
    // TODO: Modal veya detay sayfası
  }

  /**
   * Organization düzenle - Önce detayları al, sonra modal aç
   */
  onEditOrganization(organization: OrganizationListItem): void {
    this.selectedOrganization.set(organization);

    // Detaylı bilgi için API'den tam veriyi çek
    this.organizationService.getById(organization.id).subscribe({
      next: (response) => {
        const orgData = response.data;
        if (orgData) {
          this.editForm.id.set(orgData.id);
          this.editForm.name.set(orgData.name);
          this.editForm.shortName.set(orgData.shortName ?? "");
          this.editForm.typeId.set(orgData.typeId);
          this.editForm.parentId.set(orgData.parentId ?? null);
          this.editForm.description.set(orgData.description ?? "");
          this.editForm.isActive.set(orgData.isActive);
          this.editModalOpen.set(true);
          this.needsSelectInit = true;
        }
      },
      error: (err) => {
        this.error.set(
          "Birim bilgileri yüklenirken hata oluştu: " + err.message,
        );
        console.error("Load organization error:", err);
      },
    });
  }

  /**
   * Organization sil - Modal aç
   */
  deleteOrganization(organization: OrganizationListItem): void {
    this.selectedOrganization.set(organization);
    this.deleteModalOpen.set(true);
  }

  /**
   * Delete modal kapat
   */
  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.selectedOrganization.set(null);
  }

  /**
   * Silme işlemini onayla
   */
  confirmDelete(): void {
    const organization = this.selectedOrganization();
    if (!organization) return;

    this.organizationService.deleteById(organization.id).subscribe({
      next: () => {
        this.notificationService.success(
          "Birim başarıyla silindi",
          "Silme İşlemi",
        );
        this.closeDeleteModal();
        this.loadOrganizations();
      },
      error: (err) => {
        // Hata otomatik gösterilir (error-handler interceptor)
        console.error("Delete error:", err);
        this.closeDeleteModal();
      },
    });
  }

  /**
   * Yeni organization ekle - Modal aç
   */
  onAddOrganization(): void {
    this.resetCreateForm();
    this.createModalOpen.set(true);
    this.needsSelectInit = true;
  }

  /**
   * Create modal kapat
   */
  closeCreateModal(): void {
    this.createModalOpen.set(false);
    this.resetCreateForm();
  }

  /**
   * Create form resetle
   */
  resetCreateForm(): void {
    this.createForm.name.set("");
    this.createForm.shortName.set("");
    this.createForm.typeId.set(null);
    this.createForm.parentId.set(null);
    this.createForm.description.set("");
    this.createForm.isActive.set(true);
    this.createFormSubmitting.set(false);
    this.createFormTouched.name.set(false);
    this.createFormTouched.typeId.set(false);
  }

  /**
   * Form validation
   */
  isCreateFormValid(): boolean {
    const name = this.createForm.name().trim();
    const typeId = this.createForm.typeId();

    // Zorunlu alanlar
    if (name.length === 0 || !typeId) {
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

  isCreateTypeValid(): boolean {
    return this.createForm.typeId() !== null;
  }

  shouldShowCreateNameError(): boolean {
    return this.createFormTouched.name() && !this.isCreateNameValid();
  }

  shouldShowCreateTypeError(): boolean {
    return this.createFormTouched.typeId() && !this.isCreateTypeValid();
  }

  getCreateNameError(): string {
    if (!this.isCreateNameValid()) {
      return "Birim adı zorunludur";
    }
    return "";
  }

  getCreateTypeError(): string {
    if (!this.isCreateTypeValid()) {
      return "Birim tipi seçimi zorunludur";
    }
    return "";
  }

  /**
   * Yeni organization oluştur
   */
  submitCreateForm(): void {
    // Mark all fields as touched to show validation errors
    this.createFormTouched.name.set(true);
    this.createFormTouched.typeId.set(true);

    if (!this.isCreateFormValid() || this.createFormSubmitting()) {
      return;
    }

    this.createFormSubmitting.set(true);

    const request = {
      name: this.createForm.name().trim(),
      shortName: this.createForm.shortName().trim() || undefined,
      typeId: this.createForm.typeId()!,
      parentId: this.createForm.parentId() || undefined,
      description: this.createForm.description().trim() || undefined,
      isActive: this.createForm.isActive(),
    };

    this.organizationService.create(request).subscribe({
      next: () => {
        this.notificationService.success(
          "Birim başarıyla oluşturuldu",
          "İşlem Başarılı",
        );
        this.closeCreateModal();
        this.loadOrganizations();
        this.loadParentOrganizations(); // Üst organizasyon listesini yenile
      },
      error: (err) => {
        // Hata otomatik gösterilir (error-handler interceptor)
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
    this.selectedOrganization.set(null);
    this.resetEditForm();
  }

  /**
   * Edit form resetle
   */
  resetEditForm(): void {
    this.editForm.id.set("");
    this.editForm.name.set("");
    this.editForm.shortName.set("");
    this.editForm.typeId.set(null);
    this.editForm.parentId.set(null);
    this.editForm.description.set("");
    this.editForm.isActive.set(true);
    this.editFormSubmitting.set(false);
    this.editFormTouched.name.set(false);
    this.editFormTouched.typeId.set(false);
  }

  /**
   * Edit form validation
   */
  isEditFormValid(): boolean {
    const name = this.editForm.name().trim();
    const typeId = this.editForm.typeId();
    const id = this.editForm.id();

    return id.length > 0 && name.length > 0 && !!typeId;
  }

  /**
   * Field-level validation methods for edit form
   */
  isEditNameValid(): boolean {
    return this.editForm.name().trim().length > 0;
  }

  isEditTypeValid(): boolean {
    return this.editForm.typeId() !== null;
  }

  shouldShowEditNameError(): boolean {
    return this.editFormTouched.name() && !this.isEditNameValid();
  }

  shouldShowEditTypeError(): boolean {
    return this.editFormTouched.typeId() && !this.isEditTypeValid();
  }

  getEditNameError(): string {
    if (!this.isEditNameValid()) {
      return "Birim adı zorunludur";
    }
    return "";
  }

  getEditTypeError(): string {
    if (!this.isEditTypeValid()) {
      return "Birim tipi seçimi zorunludur";
    }
    return "";
  }

  /**
   * Organization güncelle
   */
  submitEditForm(): void {
    // Mark all fields as touched to show validation errors
    this.editFormTouched.name.set(true);
    this.editFormTouched.typeId.set(true);

    if (!this.isEditFormValid() || this.editFormSubmitting()) {
      return;
    }

    this.editFormSubmitting.set(true);

    const request = {
      id: this.editForm.id(),
      name: this.editForm.name().trim(),
      shortName: this.editForm.shortName().trim() || undefined,
      typeId: this.editForm.typeId()!,
      parentId: this.editForm.parentId() || undefined,
      description: this.editForm.description().trim() || undefined,
      isActive: this.editForm.isActive(),
    };

    this.organizationService.update(request.id, request).subscribe({
      next: () => {
        this.notificationService.success(
          "Birim başarıyla güncellendi",
          "Güncelleme Başarılı",
        );
        this.closeEditModal();
        this.loadOrganizations();
        this.loadParentOrganizations(); // Üst organizasyon listesini yenile
      },
      error: (err) => {
        // Hata otomatik gösterilir (error-handler interceptor)
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
   * Organizasyon tipi adını ID'ye göre getir
   */
  getOrganizationTypeName(typeId: number): string {
    const type = this.organizationTypes().find((t) => +t.id === typeId);
    return type?.name ?? "-";
  }

  /**
   * Handle filter apply from offcanvas
   */
  onFiltersApplied(filters: FilterValues): void {
    this.activeFilters.set(filters);
    this.currentPage.set(1);
    this.loadOrganizations();
  }

  /**
   * Handle filter clear from offcanvas
   */
  onFiltersCleared(): void {
    this.activeFilters.set({});
    this.currentPage.set(1);
    this.loadOrganizations();
  }

  /**
   * Clear all filters and search from main page
   */
  clearAllFilters(): void {
    this.activeFilters.set({});
    this.searchTerm.set("");
    this.currentPage.set(1);
    this.loadOrganizations();
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
}
