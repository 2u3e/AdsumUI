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
import { ReferenceService } from "../../core/services/reference.service";
import { NotificationService } from "../../core/services/notification.service";
import { MetronicInitService } from "../../core/services/metronic-init.service";
import { KTSelectService } from "../../core/services/kt-select.service";
import { WorkTypeListItem } from "../../core/models/work-type.models";
import { ReferenceDataSelectItem } from "../../core/models/reference.models";
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
  private referenceService = inject(ReferenceService);
  private notificationService = inject(NotificationService);
  private metronicInit = inject(MetronicInitService);
  private ktSelectService = inject(KTSelectService);

  // Signals
  workTypes = signal<WorkTypeListItem[]>([]);
  workGroups = signal<ReferenceDataSelectItem[]>([]);
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
    workGroupId: signal<number | null>(null),
    isActive: signal<boolean>(true),
    isCreatable: signal<boolean>(true),
    isEditable: signal<boolean>(true),
    isGeneral: signal<boolean>(false),
  };
  createFormSubmitting = signal<boolean>(false);
  createFormTouched = {
    name: signal<boolean>(false),
    workGroupId: signal<boolean>(false),
  };

  // Edit form
  editForm = {
    id: signal<string>(""),
    name: signal<string>(""),
    workGroupId: signal<number | null>(null),
    isActive: signal<boolean>(true),
    isCreatable: signal<boolean>(true),
    isEditable: signal<boolean>(true),
    isGeneral: signal<boolean>(false),
  };
  editFormSubmitting = signal<boolean>(false);
  editFormTouched = {
    name: signal<boolean>(false),
    workGroupId: signal<boolean>(false),
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

    // İş gruplarını yükle
    this.loadWorkGroups();

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
      const createModalWorkGroupSelect = document.getElementById(
        "createModalWorkGroupId",
      );

      if (createModalWorkGroupSelect) {
        setTimeout(() => {
          this.metronicInit.initSelect();
          this.createModalSelectsInitialized = true;
        }, 0);
      }
    }

    // Initialize edit modal selects only once when modal is open
    if (this.editModalOpen() && !this.editModalSelectsInitialized) {
      const editModalWorkGroupSelect = document.getElementById(
        "editModalWorkGroupId",
      );

      if (editModalWorkGroupSelect) {
        setTimeout(() => {
          this.metronicInit.initSelect();
          this.editModalSelectsInitialized = true;
        }, 0);
      }
    }
  }

  /**
   * İş gruplarını yükler
   * ReferenceId = 105 (WorkGroupType)
   */
  loadWorkGroups(): void {
    this.referenceService.getDataForSelect("105", false).subscribe({
      next: (response) => {
        this.workGroups.set(response.data ?? []);
        this.updateFilterDrawerOptions();
      },
      error: (err) => {
        console.error("Work groups loading error:", err);
      },
    });
  }

  /**
   * Update filter drawer options with loaded data
   */
  updateFilterDrawerOptions(): void {
    if (this.workGroups().length === 0) {
      return;
    }

    // Deep clone the config to ensure Angular detects changes
    const config: FilterDrawerConfig = {
      ...WORK_TYPE_FILTER_CONFIG,
      fields: WORK_TYPE_FILTER_CONFIG.fields.map((field) => ({ ...field })),
    };

    // Update workGroupId options
    const workGroupField = config.fields.find((f) => f.key === "workGroupId");
    if (workGroupField) {
      workGroupField.options = this.workGroups().map((group) => ({
        id: group.id,
        name: group.name,
      }));
    }

    this.filterDrawerConfig.set(config);
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
        workGroupId: filters["workGroupId"]
          ? +filters["workGroupId"]
          : undefined,
        isActive:
          filters["isActive"] !== undefined && filters["isActive"] !== ""
            ? filters["isActive"] === "true"
            : undefined,
        isGeneral:
          filters["isGeneral"] !== undefined && filters["isGeneral"] !== ""
            ? filters["isGeneral"] === "true"
            : undefined,
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
          this.editForm.workGroupId.set(workTypeData.workGroupId);
          this.editForm.isActive.set(workTypeData.isActive);
          this.editForm.isCreatable.set(workTypeData.isCreatable);
          this.editForm.isEditable.set(workTypeData.isEditable);
          this.editForm.isGeneral.set(workTypeData.isGeneral);
          this.editModalOpen.set(true);

          // Update KT Select UI after values are set
          setTimeout(() => {
            this.updateEditModalSelectUI();
          }, 100);
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
    this.createForm.workGroupId.set(null);
    this.createForm.isActive.set(true);
    this.createForm.isCreatable.set(true);
    this.createForm.isEditable.set(true);
    this.createForm.isGeneral.set(false);
    this.createFormSubmitting.set(false);
    this.createFormTouched.name.set(false);
    this.createFormTouched.workGroupId.set(false);
  }

  /**
   * Form validation
   */
  isCreateFormValid(): boolean {
    const name = this.createForm.name().trim();
    const workGroupId = this.createForm.workGroupId();

    // Zorunlu alanlar
    if (name.length === 0 || !workGroupId) {
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

  isCreateWorkGroupValid(): boolean {
    return this.createForm.workGroupId() !== null;
  }

  shouldShowCreateNameError(): boolean {
    return this.createFormTouched.name() && !this.isCreateNameValid();
  }

  shouldShowCreateWorkGroupError(): boolean {
    return (
      this.createFormTouched.workGroupId() && !this.isCreateWorkGroupValid()
    );
  }

  getCreateNameError(): string {
    if (!this.isCreateNameValid()) {
      return "İş tipi adı zorunludur";
    }
    return "";
  }

  getCreateWorkGroupError(): string {
    if (!this.isCreateWorkGroupValid()) {
      return "İş grubu seçimi zorunludur";
    }
    return "";
  }

  /**
   * Yeni work type oluştur
   */
  submitCreateForm(): void {
    // Mark all fields as touched to show validation errors
    this.createFormTouched.name.set(true);
    this.createFormTouched.workGroupId.set(true);

    if (!this.isCreateFormValid() || this.createFormSubmitting()) {
      return;
    }

    this.createFormSubmitting.set(true);

    const request = {
      name: this.createForm.name().trim(),
      workGroupId: this.createForm.workGroupId()!,
      isActive: this.createForm.isActive(),
      isCreatable: this.createForm.isCreatable(),
      isEditable: this.createForm.isEditable(),
      isGeneral: this.createForm.isGeneral(),
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
    this.editForm.workGroupId.set(null);
    this.editForm.isActive.set(true);
    this.editForm.isCreatable.set(true);
    this.editForm.isEditable.set(true);
    this.editForm.isGeneral.set(false);
    this.editFormSubmitting.set(false);
    this.editFormTouched.name.set(false);
    this.editFormTouched.workGroupId.set(false);
  }

  /**
   * Edit form validation
   */
  isEditFormValid(): boolean {
    const name = this.editForm.name().trim();
    const workGroupId = this.editForm.workGroupId();
    const id = this.editForm.id();

    return id.length > 0 && name.length > 0 && !!workGroupId;
  }

  /**
   * Field-level validation methods for edit form
   */
  isEditNameValid(): boolean {
    return this.editForm.name().trim().length > 0;
  }

  isEditWorkGroupValid(): boolean {
    return this.editForm.workGroupId() !== null;
  }

  shouldShowEditNameError(): boolean {
    return this.editFormTouched.name() && !this.isEditNameValid();
  }

  shouldShowEditWorkGroupError(): boolean {
    return this.editFormTouched.workGroupId() && !this.isEditWorkGroupValid();
  }

  getEditNameError(): string {
    if (!this.isEditNameValid()) {
      return "İş tipi adı zorunludur";
    }
    return "";
  }

  getEditWorkGroupError(): string {
    if (!this.isEditWorkGroupValid()) {
      return "İş grubu seçimi zorunludur";
    }
    return "";
  }

  /**
   * WorkType güncelle
   */
  submitEditForm(): void {
    // Mark all fields as touched to show validation errors
    this.editFormTouched.name.set(true);
    this.editFormTouched.workGroupId.set(true);

    if (!this.isEditFormValid() || this.editFormSubmitting()) {
      return;
    }

    this.editFormSubmitting.set(true);

    const request = {
      id: this.editForm.id(),
      name: this.editForm.name().trim(),
      workGroupId: this.editForm.workGroupId()!,
      isActive: this.editForm.isActive(),
      isCreatable: this.editForm.isCreatable(),
      isEditable: this.editForm.isEditable(),
      isGeneral: this.editForm.isGeneral(),
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
   * Update KT Select UI for edit modal to reflect current values
   */
  private updateEditModalSelectUI(): void {
    const selectIds = ["editModalWorkGroupId"];

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
    // Subject cleanup
    this.searchSubject.complete();

    // Destroy KT Select instances for modals
    this.ktSelectService.destroyInstances(
      "createModalWorkGroupId",
      "editModalWorkGroupId",
    );
  }
}
