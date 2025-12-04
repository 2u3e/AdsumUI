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

import { CitizenService } from "../../core/services/citizen.service";
import { NotificationService } from "../../core/services/notification.service";
import { MetronicInitService } from "../../core/services/metronic-init.service";
import { CitizenListItem } from "../../core/models/citizen.models";
import { PaginationMeta } from "../../core/models/api.models";
import { OffcanvasFilterComponent } from "../../shared/components/offcanvas-filter/offcanvas-filter.component";
import {
  FilterDrawerConfig,
  FilterValues,
} from "../../shared/components/filter-drawer/filter-config.interface";
import { CITIZEN_FILTER_CONFIG } from "./citizen-filter.config";

@Component({
  selector: "app-citizen",
  standalone: true,
  imports: [CommonModule, FormsModule, OffcanvasFilterComponent],
  templateUrl: "./citizen.component.html",
  styleUrls: ["./citizen.component.scss"],
})
export class CitizenComponent implements OnInit, AfterViewChecked, OnDestroy {
  private citizenService = inject(CitizenService);
  private notificationService = inject(NotificationService);
  private metronicInit = inject(MetronicInitService);

  // Signals
  citizens = signal<CitizenListItem[]>([]);
  pagination = signal<PaginationMeta | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  deleteModalOpen = signal<boolean>(false);
  createModalOpen = signal<boolean>(false);
  editModalOpen = signal<boolean>(false);
  selectedCitizen = signal<CitizenListItem | null>(null);

  // Create form
  createForm = {
    identityNumber: signal<string>(""),
    name: signal<string>(""),
    lastName: signal<string>(""),
    birthDate: signal<string>(""),
    birthPlace: signal<string>(""),
    isActive: signal<boolean>(true),
  };
  createFormSubmitting = signal<boolean>(false);
  createFormTouched = {
    identityNumber: signal<boolean>(false),
    name: signal<boolean>(false),
    lastName: signal<boolean>(false),
    birthDate: signal<boolean>(false),
  };

  // Edit form
  editForm = {
    id: signal<string>(""),
    name: signal<string>(""),
    lastName: signal<string>(""),
    birthDate: signal<string>(""),
    birthPlace: signal<string>(""),
    isActive: signal<boolean>(true),
  };
  editFormSubmitting = signal<boolean>(false);
  editFormTouched = {
    name: signal<boolean>(false),
    lastName: signal<boolean>(false),
    birthDate: signal<boolean>(false),
  };

  // Search ve pagination parametreleri
  searchTerm = signal<string>("");
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Filter offcanvas
  filterDrawerConfig = signal<FilterDrawerConfig>(CITIZEN_FILTER_CONFIG);
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
    () => this.citizens().filter((c) => c.isActive).length,
  );

  // Pagination display info
  displayFrom = computed(() => {
    if (this.citizens().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  displayTo = computed(() => {
    const citizensLength = this.citizens().length;
    if (citizensLength === 0) return 0;

    const from = this.displayFrom();
    return from + citizensLength - 1;
  });

  displayTotal = computed(() => {
    const total = this.totalCount();
    if (total === 0 && this.citizens().length > 0) {
      return this.citizens().length;
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
        this.loadCitizens();
      });

    // İlk yükleme
    this.loadCitizens();

    // Initialize select and tooltip components after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.metronicInit.initSelect();
      this.metronicInit.initTooltips();
    }, 100);
  }

  ngAfterViewChecked(): void {
    if (this.needsSelectInit) {
      // KT Select'i initialize et
      this.metronicInit.initSelect();
      this.metronicInit.initTooltips();
      this.needsSelectInit = false;
    }
  }

  /**
   * Citizen verilerini yükler
   */
  loadCitizens(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.activeFilters();

    this.citizenService
      .getAllPaged({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        identityNumber:
          filters["identityNumber"] || this.searchTerm() || undefined,
        name: filters["name"] || undefined,
        lastName: filters["lastName"] || undefined,
      })
      .subscribe({
        next: (response) => {
          this.citizens.set(response.data ?? []);

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
          console.error("Citizen loading error:", err);
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
    this.loadCitizens();
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
    this.loadCitizens();
  }

  /**
   * Yenile
   */
  refresh(): void {
    this.loadCitizens();
  }

  /**
   * Citizen görüntüle
   */
  onViewCitizen(citizen: CitizenListItem): void {
    console.log("Citizen görüntüle:", citizen);
    // TODO: Modal veya detay sayfası
  }

  /**
   * Citizen düzenle - Önce detayları al, sonra modal aç
   */
  onEditCitizen(citizen: CitizenListItem): void {
    this.selectedCitizen.set(citizen);

    // Detaylı bilgi için API'den tam veriyi çek
    this.citizenService.getById(citizen.id).subscribe({
      next: (response) => {
        const citizenData = response.data;
        if (citizenData) {
          this.editForm.id.set(citizenData.id);
          this.editForm.name.set(citizenData.name);
          this.editForm.lastName.set(citizenData.lastName);
          // Tarih formatını düzelt (ISO string -> YYYY-MM-DD)
          const birthDate = new Date(citizenData.birthDate);
          this.editForm.birthDate.set(birthDate.toISOString().split("T")[0]);
          this.editForm.birthPlace.set(citizenData.birthPlace ?? "");
          this.editForm.isActive.set(citizenData.isActive);
          this.editModalOpen.set(true);
          this.needsSelectInit = true;
        }
      },
      error: (err) => {
        this.error.set(
          "Vatandaş bilgileri yüklenirken hata oluştu: " + err.message,
        );
        console.error("Load citizen error:", err);
      },
    });
  }

  /**
   * Citizen sil - Modal aç
   */
  deleteCitizen(citizen: CitizenListItem): void {
    this.selectedCitizen.set(citizen);
    this.deleteModalOpen.set(true);
  }

  /**
   * Delete modal kapat
   */
  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.selectedCitizen.set(null);
  }

  /**
   * Silme işlemini onayla
   */
  confirmDelete(): void {
    const citizen = this.selectedCitizen();
    if (!citizen) return;

    this.citizenService.deleteById(citizen.id).subscribe({
      next: () => {
        this.notificationService.success(
          "Vatandaş başarıyla silindi",
          "Silme İşlemi",
        );
        this.closeDeleteModal();
        this.loadCitizens();
      },
      error: (err) => {
        // Hata otomatik gösterilir (error-handler interceptor)
        console.error("Delete error:", err);
        this.closeDeleteModal();
      },
    });
  }

  /**
   * Yeni citizen ekle - Modal aç
   */
  onAddCitizen(): void {
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
    this.createForm.identityNumber.set("");
    this.createForm.name.set("");
    this.createForm.lastName.set("");
    this.createForm.birthDate.set("");
    this.createForm.birthPlace.set("");
    this.createForm.isActive.set(true);
    this.createFormSubmitting.set(false);
    this.createFormTouched.identityNumber.set(false);
    this.createFormTouched.name.set(false);
    this.createFormTouched.lastName.set(false);
    this.createFormTouched.birthDate.set(false);
  }

  /**
   * Form validation
   */
  isCreateFormValid(): boolean {
    return (
      this.isCreateIdentityNumberValid() &&
      this.isCreateNameValid() &&
      this.isCreateLastNameValid() &&
      this.isCreateBirthDateValid()
    );
  }

  /**
   * Field-level validation methods for create form
   */
  isCreateIdentityNumberValid(): boolean {
    const identityNumber = this.createForm.identityNumber().trim();

    // Boş olamaz
    if (identityNumber.length === 0) {
      return false;
    }

    // Tam olarak 11 haneli olmalı
    if (identityNumber.length !== 11) {
      return false;
    }

    // Sadece rakamlardan oluşmalı
    if (!/^\d{11}$/.test(identityNumber)) {
      return false;
    }

    // İlk hane 0 olamaz
    if (identityNumber[0] === "0") {
      return false;
    }

    return true;
  }

  isCreateNameValid(): boolean {
    return this.createForm.name().trim().length > 0;
  }

  isCreateLastNameValid(): boolean {
    return this.createForm.lastName().trim().length > 0;
  }

  isCreateBirthDateValid(): boolean {
    return this.createForm.birthDate().length > 0;
  }

  shouldShowCreateIdentityNumberError(): boolean {
    return (
      this.createFormTouched.identityNumber() &&
      !this.isCreateIdentityNumberValid()
    );
  }

  shouldShowCreateNameError(): boolean {
    return this.createFormTouched.name() && !this.isCreateNameValid();
  }

  shouldShowCreateLastNameError(): boolean {
    return this.createFormTouched.lastName() && !this.isCreateLastNameValid();
  }

  shouldShowCreateBirthDateError(): boolean {
    return this.createFormTouched.birthDate() && !this.isCreateBirthDateValid();
  }

  getCreateIdentityNumberError(): string {
    const identityNumber = this.createForm.identityNumber().trim();

    if (identityNumber.length === 0) {
      return "TC Kimlik Numarası zorunludur";
    }

    // Önce harf/özel karakter kontrolü (daha spesifik hata)
    if (!/^\d+$/.test(identityNumber)) {
      return "TC Kimlik Numarası sadece rakam içermelidir (harf veya özel karakter kullanılamaz)";
    }

    if (identityNumber.length !== 11) {
      return "TC Kimlik Numarası tam olarak 11 haneli olmalıdır";
    }

    if (identityNumber[0] === "0") {
      return "TC Kimlik Numarası 0 ile başlayamaz";
    }

    return "";
  }

  getCreateNameError(): string {
    if (!this.isCreateNameValid()) {
      return "Ad zorunludur";
    }
    return "";
  }

  getCreateLastNameError(): string {
    if (!this.isCreateLastNameValid()) {
      return "Soyad zorunludur";
    }
    return "";
  }

  getCreateBirthDateError(): string {
    if (!this.isCreateBirthDateValid()) {
      return "Doğum tarihi zorunludur";
    }
    return "";
  }

  /**
   * Yeni citizen oluştur
   */
  submitCreateForm(): void {
    // Mark all fields as touched to show validation errors
    this.createFormTouched.identityNumber.set(true);
    this.createFormTouched.name.set(true);
    this.createFormTouched.lastName.set(true);
    this.createFormTouched.birthDate.set(true);

    if (!this.isCreateFormValid() || this.createFormSubmitting()) {
      return;
    }

    this.createFormSubmitting.set(true);

    const request = {
      identityNumber: this.createForm.identityNumber().trim(),
      name: this.createForm.name().trim(),
      lastName: this.createForm.lastName().trim(),
      birthDate: this.createForm.birthDate(),
      birthPlace: this.createForm.birthPlace().trim() || undefined,
      isActive: this.createForm.isActive(),
    };

    this.citizenService.create(request).subscribe({
      next: () => {
        this.notificationService.success(
          "Vatandaş başarıyla oluşturuldu",
          "İşlem Başarılı",
        );
        this.closeCreateModal();
        this.loadCitizens();
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
    this.selectedCitizen.set(null);
    this.resetEditForm();
  }

  /**
   * Edit form resetle
   */
  resetEditForm(): void {
    this.editForm.id.set("");
    this.editForm.name.set("");
    this.editForm.lastName.set("");
    this.editForm.birthDate.set("");
    this.editForm.birthPlace.set("");
    this.editForm.isActive.set(true);
    this.editFormSubmitting.set(false);
    this.editFormTouched.name.set(false);
    this.editFormTouched.lastName.set(false);
    this.editFormTouched.birthDate.set(false);
  }

  /**
   * Edit form validation
   */
  isEditFormValid(): boolean {
    const name = this.editForm.name().trim();
    const lastName = this.editForm.lastName().trim();
    const birthDate = this.editForm.birthDate();
    const id = this.editForm.id();

    return (
      id.length > 0 && name.length > 0 && lastName.length > 0 && !!birthDate
    );
  }

  /**
   * Field-level validation methods for edit form
   */
  isEditNameValid(): boolean {
    return this.editForm.name().trim().length > 0;
  }

  isEditLastNameValid(): boolean {
    return this.editForm.lastName().trim().length > 0;
  }

  isEditBirthDateValid(): boolean {
    return this.editForm.birthDate().length > 0;
  }

  shouldShowEditNameError(): boolean {
    return this.editFormTouched.name() && !this.isEditNameValid();
  }

  shouldShowEditLastNameError(): boolean {
    return this.editFormTouched.lastName() && !this.isEditLastNameValid();
  }

  shouldShowEditBirthDateError(): boolean {
    return this.editFormTouched.birthDate() && !this.isEditBirthDateValid();
  }

  getEditNameError(): string {
    if (!this.isEditNameValid()) {
      return "Ad zorunludur";
    }
    return "";
  }

  getEditLastNameError(): string {
    if (!this.isEditLastNameValid()) {
      return "Soyad zorunludur";
    }
    return "";
  }

  getEditBirthDateError(): string {
    if (!this.isEditBirthDateValid()) {
      return "Doğum tarihi zorunludur";
    }
    return "";
  }

  /**
   * Citizen güncelle
   */
  submitEditForm(): void {
    // Mark all fields as touched to show validation errors
    this.editFormTouched.name.set(true);
    this.editFormTouched.lastName.set(true);
    this.editFormTouched.birthDate.set(true);

    if (!this.isEditFormValid() || this.editFormSubmitting()) {
      return;
    }

    this.editFormSubmitting.set(true);

    const request = {
      id: this.editForm.id(),
      name: this.editForm.name().trim(),
      lastName: this.editForm.lastName().trim(),
      birthDate: this.editForm.birthDate(),
      birthPlace: this.editForm.birthPlace().trim() || undefined,
      isActive: this.editForm.isActive(),
    };

    this.citizenService.update(request.id, request).subscribe({
      next: () => {
        this.notificationService.success(
          "Vatandaş başarıyla güncellendi",
          "Güncelleme Başarılı",
        );
        this.closeEditModal();
        this.loadCitizens();
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
   * Tarih formatlama helper
   */
  formatDate(dateString: string): string {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("tr-TR");
    } catch {
      return dateString;
    }
  }

  /**
   * Handle filter apply from offcanvas
   */
  onFiltersApplied(filters: FilterValues): void {
    this.activeFilters.set(filters);
    this.currentPage.set(1);
    this.loadCitizens();
  }

  /**
   * Handle filter clear from offcanvas
   */
  onFiltersCleared(): void {
    this.activeFilters.set({});
    this.currentPage.set(1);
    this.loadCitizens();
  }

  /**
   * Clear all filters and search from main page
   */
  clearAllFilters(): void {
    this.activeFilters.set({});
    this.searchTerm.set("");
    this.currentPage.set(1);
    this.loadCitizens();
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
