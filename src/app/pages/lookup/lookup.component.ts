import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, debounceTime, distinctUntilChanged } from "rxjs";

import { ReferenceService } from "../../core/services/reference.service";
import { ReferenceItem } from "../../core/models/reference.models";
import { PaginationMeta } from "../../core/models/api.models";

@Component({
  selector: "app-lookup",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./lookup.component.html",
  styleUrls: ["./lookup.component.scss"],
})
export class LookupComponent implements OnInit {
  private referenceService = inject(ReferenceService);

  // Signals
  references = signal<ReferenceItem[]>([]);
  pagination = signal<PaginationMeta | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  deleteModalOpen = signal<boolean>(false);
  createModalOpen = signal<boolean>(false);
  editModalOpen = signal<boolean>(false);
  selectedReference = signal<ReferenceItem | null>(null);

  // Create form
  createForm = {
    name: signal<string>(""),
    shortName: signal<string>(""),
    isActive: signal<boolean>(true),
  };
  createFormSubmitting = signal<boolean>(false);

  // Edit form
  editForm = {
    id: signal<string>(""),
    name: signal<string>(""),
    shortName: signal<string>(""),
    isActive: signal<boolean>(true),
  };
  editFormSubmitting = signal<boolean>(false);

  // Search ve pagination parametreleri
  searchTerm = signal<string>("");
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Search debounce için
  private searchSubject = new Subject<string>();

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
    () => this.references().filter((r) => r.isActive).length,
  );

  // Pagination display info
  displayFrom = computed(() => {
    if (this.references().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  displayTo = computed(() => {
    const referencesLength = this.references().length;
    if (referencesLength === 0) return 0;

    const from = this.displayFrom();
    return from + referencesLength - 1;
  });

  displayTotal = computed(() => {
    const total = this.totalCount();
    if (total === 0 && this.references().length > 0) {
      return this.references().length;
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
        this.loadReferences();
      });

    // İlk yükleme
    this.loadReferences();
  }

  /**
   * Reference verilerini yükler
   */
  loadReferences(): void {
    this.loading.set(true);
    this.error.set(null);

    this.referenceService
      .getAllPaged({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        searchTerm: this.searchTerm() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.references.set(response.data ?? []);

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
        },
        error: (err) => {
          this.error.set(err.message || "Veriler yüklenirken bir hata oluştu");
          this.loading.set(false);
          console.error("Reference loading error:", err);
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
    this.loadReferences();
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
    this.loadReferences();
  }

  /**
   * Yenile
   */
  refresh(): void {
    this.loadReferences();
  }

  /**
   * Reference görüntüle
   */
  onViewReference(reference: ReferenceItem): void {
    console.log("Reference görüntüle:", reference);
    // TODO: Modal veya detay sayfası
  }

  /**
   * Reference düzenle
   */
  onEditReference(reference: ReferenceItem): void {
    this.selectedReference.set(reference);
    this.editForm.id.set(reference.id);
    this.editForm.name.set(reference.name);
    this.editForm.shortName.set(reference.shortName ?? "");
    this.editForm.isActive.set(reference.isActive);
    this.editModalOpen.set(true);
  }

  /**
   * Reference sil - Modal aç
   */
  deleteReference(reference: ReferenceItem): void {
    this.selectedReference.set(reference);
    this.deleteModalOpen.set(true);
  }

  /**
   * Delete modal kapat
   */
  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.selectedReference.set(null);
  }

  /**
   * Silme işlemini onayla
   */
  confirmDelete(): void {
    const reference = this.selectedReference();
    if (!reference) return;

    this.referenceService.deleteById(reference.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadReferences();
      },
      error: (err) => {
        this.error.set("Silme işlemi başarısız: " + err.message);
        console.error("Delete error:", err);
        this.closeDeleteModal();
      },
    });
  }

  /**
   * Yeni reference ekle - Modal aç
   */
  onAddReference(): void {
    this.resetCreateForm();
    this.createModalOpen.set(true);
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
    this.createForm.isActive.set(true);
    this.createFormSubmitting.set(false);
  }

  /**
   * Form validation
   */
  isCreateFormValid(): boolean {
    const name = this.createForm.name().trim();
    return name.length > 0;
  }

  /**
   * Yeni reference oluştur
   */
  submitCreateForm(): void {
    if (!this.isCreateFormValid() || this.createFormSubmitting()) {
      return;
    }

    this.createFormSubmitting.set(true);

    const request = {
      name: this.createForm.name().trim(),
      shortName: this.createForm.shortName().trim() || undefined,
      isActive: this.createForm.isActive(),
    };

    this.referenceService.create(request).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadReferences();
      },
      error: (err) => {
        this.error.set("Kayıt oluşturulurken hata oluştu: " + err.message);
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
    this.selectedReference.set(null);
    this.resetEditForm();
  }

  /**
   * Edit form resetle
   */
  resetEditForm(): void {
    this.editForm.id.set("");
    this.editForm.name.set("");
    this.editForm.shortName.set("");
    this.editForm.isActive.set(true);
    this.editFormSubmitting.set(false);
  }

  /**
   * Edit form validation
   */
  isEditFormValid(): boolean {
    const name = this.editForm.name().trim();
    return name.length > 0 && this.editForm.id().length > 0;
  }

  /**
   * Reference güncelle
   */
  submitEditForm(): void {
    if (!this.isEditFormValid() || this.editFormSubmitting()) {
      return;
    }

    this.editFormSubmitting.set(true);

    const request = {
      id: this.editForm.id(),
      businessId: 0, // API'ye göre gerekli, ama kullanılmayabilir
      name: this.editForm.name().trim(),
      shortName: this.editForm.shortName().trim() || undefined,
      isActive: this.editForm.isActive(),
    };

    this.referenceService.update(request).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadReferences();
      },
      error: (err) => {
        this.error.set("Güncelleme sırasında hata oluştu: " + err.message);
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
}
