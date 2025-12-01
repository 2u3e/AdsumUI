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

import { WorkTypeService } from "../../core/services/work-type.service";
import { NotificationService } from "../../core/services/notification.service";
import { MetronicInitService } from "../../core/services/metronic-init.service";
import { WorkTypeListItem } from "../../core/models/work-type.models";
import { PaginationMeta } from "../../core/models/api.models";
import { OffcanvasFilterComponent } from "../../shared/components/offcanvas-filter/offcanvas-filter.component";
import {
  FilterDrawerConfig,
  FilterValues,
} from "../../shared/components/filter-drawer/filter-config.interface";
import { WORK_TYPE_FILTER_CONFIG } from "./work-type-filter.config";

@Component({
  selector: "app-work-type",
  standalone: true,
  imports: [CommonModule, FormsModule, OffcanvasFilterComponent],
  templateUrl: "./work-type.component.html",
  styleUrls: ["./work-type.component.scss"],
})
export class WorkTypeComponent implements OnInit, AfterViewChecked, OnDestroy {
  private workTypeService = inject(WorkTypeService);
  private notificationService = inject(NotificationService);
  private metronicInit = inject(MetronicInitService);

  // Signals
  workTypes = signal<WorkTypeListItem[]>([]);
  pagination = signal<PaginationMeta | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  deleteModalOpen = signal<boolean>(false);
  createModalOpen = signal<boolean>(false);
  editModalOpen = signal<boolean>(false);
  selectedWorkType = signal<WorkTypeListItem | null>(null);

  // Create form
  createForm = {
    name: signal<string>(""),
    groupId: signal<string | null>(null),
    isActive: signal<boolean>(true),
    isCreatable: signal<boolean>(true),
    isEditable: signal<boolean>(true),
  };
  createFormSubmitting = signal<boolean>(false);
  createFormTouched = {
    name: signal<boolean>(false),
  };

  // Edit form
  editForm = {
    id: signal<string>(""),
    name: signal<string>(""),
    groupId: signal<string | null>(null),
    isActive: signal<boolean>(true),
    isCreatable: signal<boolean>(true),
    isEditable: signal<boolean>(true),
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
  filterDrawerConfig = signal<FilterDrawerConfig>(WORK_TYPE_FILTER_CONFIG);
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
  activeCount = computed(
    () => this.workTypes().filter((w) => w.isActive).length,
  );

  // Pagination display info
  displayFrom = computed(() => {
    if (this.workTypes().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  displayTo = computed(() => {
    const workTypesLength = this.workTypes().length;
    if (workTypesLength === 0) return 0;

    const from = this.displayFrom();
    return from + workTypesLength - 1;
  });

  displayTotal = computed(() => {
    const total = this.totalCount();
    if (total === 0 && this.workTypes().length > 0) {
      return this.workTypes().length;
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
        this.loadWorkTypes();
      });

    // İlk yükleme
    this.loadWorkTypes();

    // Initialize select and tooltip components after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.metronicInit.initSelect();
      this.metronicInit.initTooltips();
    }, 100);
  }

  ngAfterViewChecked(): void {
    // Initialize create modal selects only once when modal is open
    if (this.createModalOpen() && !this.createModalSelectsInitialized) {
      setTimeout(() => {
        this.metronicInit.initSelect();
        this.createModalSelectsInitialized = true;
      }, 0);
    }

    // Initialize edit modal selects only once when modal is open
    if (this.editModalOpen() && !this.editModalSelectsInitialized) {
      setTimeout(() => {
        this.metronicInit.initSelect();
        this.editModalSelectsInitialized = true;
      }, 0);
    }
  }

  /**
   * WorkType verilerini yükler
   */
  loadWorkTypes(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.activeFilters();

    this.workTypeService
      .getAllPaged({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        name: filters["name"] || this.searchTerm() || undefined,
        isActive:
          filters["isActive"] !== undefined && filters["isActive"] !== ""
            ? filters["isActive"] === "true"
            : undefined,
        isCreatable:
          filters["isCreatable"] !== undefined && filters["isCreatable"] !== ""
            ? filters["isCreatable"] === "true"
            : undefined,
        groupId: filters["groupId"] || undefined,
      })
      .subscribe({
        next: (response) => {
          this.workTypes.set(response.data ?? []);

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
          console.error("WorkType loading error:", err);
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
    this.loadWorkTypes();
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
    this.loadWorkTypes();
  }

  /**
   * Yenile
   */
  refresh(): void {
    this.loadWorkTypes();
  }

  /**
   * WorkType düzenle - Önce detayları al, sonra modal aç
   */
  onEditWorkType(workType: WorkTypeListItem): void {
    this.selectedWorkType.set(workType);

    // Detaylı bilgi için API'den tam veriyi çek
    this.workTypeService.getById(workType.id).subscribe({
      next: (response) => {
        const workTypeData = response.data;
        if (workTypeData) {
          this.editForm.id.set(workTypeData.id);
          this.editForm.name.set(workTypeData.name);
          this.editForm.groupId.set(workTypeData.groupId ?? null);
          this.editForm.isActive.set(workTypeData.isActive);
          this.editForm.isCreatable.set(workTypeData.isCreatable);
          this.editForm.isEditable.set(workTypeData.isEditable);
          this.editModalOpen.set(true);
        }
      },
      error: (err) => {
        this.error.set(
          "İş tipi bilgileri yüklenirken hata oluştu: " + err.message,
        );
        console.error("Load work type error:", err);
      },
    });
  }

  /**
   * WorkType sil - Modal aç
   */
  deleteWorkType(workType: WorkTypeListItem): void {
    this.selectedWorkType.set(workType);
    this.deleteModalOpen.set(true);
  }

  /**
   * Delete modal kapat
   */
  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.selectedWorkType.set(null);
  }

  /**
   * Silme işlemini onayla
   */
  confirmDelete(): void {
    const workType = this.selectedWorkType();
    if (!workType) return;

    this.workTypeService.deleteById(workType.id).subscribe({
      next: () => {
        this.notificationService.success(
          "İş tipi başarıyla silindi",
          "Silme İşlemi",
        );
        this.closeDeleteModal();
        this.loadWorkTypes();
      },
      error: (err) => {
        // Hata otomatik gösterilir (error-handler interceptor)
        console.error("Delete error:", err);
        this.closeDeleteModal();
      },
    });
  }

  /**
   * Yeni work type ekle - Modal aç
   */
  onAddWorkType(): void {
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
    this.createForm.name.set("");
    this.createForm.groupId.set(null);
    this.createForm.isActive.set(true);
    this.createForm.isCreatable.set(true);
    this.createForm.isEditable.set(true);
    this.createFormSubmitting.set(false);
    this.createFormTouched.name.set(false);
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
      return "İş tipi adı zorunludur";
    }
    return "";
  }

  /**
   * Yeni work type oluştur
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
      groupId: this.createForm.groupId() || undefined,
      isActive: this.createForm.isActive(),
      isCreatable: this.createForm.isCreatable(),
      isEditable: this.createForm.isEditable(),
    };

    this.workTypeService.create(request).subscribe({
      next: () => {
        this.notificationService.success(
          "İş tipi başarıyla oluşturuldu",
          "İşlem Başarılı",
        );
        this.closeCreateModal();
        this.loadWorkTypes();
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
    this.editModalSelectsInitialized = false;
    this.selectedWorkType.set(null);
    this.resetEditForm();
  }

  /**
   * Edit form resetle
   */
  resetEditForm(): void {
    this.editForm.id.set("");
    this.editForm.name.set("");
    this.editForm.groupId.set(null);
    this.editForm.isActive.set(true);
    this.editForm.isCreatable.set(true);
    this.editForm.isEditable.set(true);
    this.editFormSubmitting.set(false);
    this.editFormTouched.name.set(false);
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
      return "İş tipi adı zorunludur";
    }
    return "";
  }

  /**
   * WorkType güncelle
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
      groupId: this.editForm.groupId() || undefined,
      isActive: this.editForm.isActive(),
      isCreatable: this.editForm.isCreatable(),
      isEditable: this.editForm.isEditable(),
    };

    this.workTypeService.update(request.id, request).subscribe({
      next: () => {
        this.notificationService.success(
          "İş tipi başarıyla güncellendi",
          "Güncelleme Başarılı",
        );
        this.closeEditModal();
        this.loadWorkTypes();
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
   * Handle filter apply from offcanvas
   */
  onFiltersApplied(filters: FilterValues): void {
    this.activeFilters.set(filters);
    this.currentPage.set(1);
    this.loadWorkTypes();
  }

  /**
   * Handle filter clear from offcanvas
   */
  onFiltersCleared(): void {
    this.activeFilters.set({});
    this.currentPage.set(1);
    this.loadWorkTypes();
  }

  /**
   * Clear all filters and search from main page
   */
  clearAllFilters(): void {
    this.activeFilters.set({});
    this.searchTerm.set("");
    this.currentPage.set(1);
    this.loadWorkTypes();
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
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    // Subject cleanup
    this.searchSubject.complete();
  }
}
