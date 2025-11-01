import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, debounceTime, distinctUntilChanged } from "rxjs";

import { LookupService } from "../../core/services/lookup.service";
import { LookupItem } from "../../core/models/lookup.models";
import { PaginationMeta } from "../../core/models/api.models";

@Component({
  selector: "app-lookup",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./lookup.component.html",
  styleUrls: ["./lookup.component.scss"],
})
export class LookupComponent implements OnInit {
  private lookupService = inject(LookupService);

  // Signals
  lookups = signal<LookupItem[]>([]);
  pagination = signal<PaginationMeta | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  deleteModalOpen = signal<boolean>(false);
  createModalOpen = signal<boolean>(false);
  selectedLookup = signal<LookupItem | null>(null);

  // Create form
  createForm = {
    id: signal<number | null>(null),
    name: signal<string>(""),
    shortName: signal<string>(""),
    isActive: signal<boolean>(true),
  };
  createFormSubmitting = signal<boolean>(false);

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
    // Fallback: mevcut sayfa < toplam sayfa
    const current =
      pagination.page ?? pagination.currentPage ?? this.currentPage();
    return current < (pagination.totalPages ?? 0);
  });
  hasPreviousPage = computed(() => {
    const pagination = this.pagination();
    if (!pagination) return false;
    if (pagination.hasPreviousPage !== undefined)
      return pagination.hasPreviousPage;
    // Fallback: mevcut sayfa > 1
    const current =
      pagination.page ?? pagination.currentPage ?? this.currentPage();
    return current > 1;
  });
  totalCount = computed(() => {
    const pagination = this.pagination();
    if (!pagination) return 0;
    // API'dan gelen sırayla kontrol et: totalItems > totalItem > totalCount
    return (
      pagination.totalItems ??
      pagination.totalItem ??
      pagination.totalCount ??
      0
    );
  });
  activeCount = computed(() => this.lookups().filter((l) => l.isActive).length);

  // Pagination display info
  displayFrom = computed(() => {
    if (this.lookups().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  displayTo = computed(() => {
    const lookupsLength = this.lookups().length;
    if (lookupsLength === 0) return 0;

    const from = this.displayFrom();
    return from + lookupsLength - 1;
  });

  displayTotal = computed(() => {
    // totalCount artık totalItem veya totalCount'tan geliyor
    const total = this.totalCount();
    // Eğer pagination bilgisi yoksa mevcut sayfa kayıtlarını göster
    if (total === 0 && this.lookups().length > 0) {
      return this.lookups().length;
    }
    return total;
  });

  // Sayfa numaraları için array (pagination buttons)
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 0) return pages;

    // Başlangıç sayfası
    pages.push(1);

    if (total <= 5) {
      // 5 veya daha az sayfa varsa hepsini göster
      for (let i = 2; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Daha fazla sayfa varsa akıllı gösterim
      if (current <= 3) {
        pages.push(2, 3, 4);
      } else if (current >= total - 2) {
        pages.push(total - 3, total - 2, total - 1);
      } else {
        pages.push(current - 1, current, current + 1);
      }

      // Son sayfayı ekle
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
        this.loadLookups();
      });

    // İlk yükleme
    this.loadLookups();
  }

  /**
   * Lookup verilerini yükler
   */
  loadLookups(): void {
    this.loading.set(true);
    this.error.set(null);

    this.lookupService
      .getAllPaged({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        searchTerm: this.searchTerm() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.lookups.set(response.data ?? []);

          // Eğer API'dan pagination gelmediyse, fallback oluştur
          if (response.pagination) {
            this.pagination.set(response.pagination);
          } else if (response.data && response.data.length > 0) {
            // Pagination yoksa basit bir fallback oluştur
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
          console.error("Lookup loading error:", err);
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
    this.loadLookups();
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
    this.loadLookups();
  }

  /**
   * Yenile
   */
  refresh(): void {
    this.loadLookups();
  }

  /**
   * Active/Inactive durumunu toggle et
   */
  toggleActive(lookup: LookupItem): void {
    this.lookupService.toggleActive(lookup.id).subscribe({
      next: () => {
        this.loadLookups();
      },
      error: (err) => {
        this.error.set("Durum güncellenirken hata oluştu: " + err.message);
        console.error("Toggle active error:", err);
      },
    });
  }

  /**
   * Lookup görüntüle
   */
  onViewLookup(lookup: LookupItem): void {
    console.log("Lookup görüntüle:", lookup);
    // TODO: Modal veya detay sayfası
  }

  /**
   * Lookup düzenle
   */
  onEditLookup(lookup: LookupItem): void {
    console.log("Lookup düzenle:", lookup);
    // TODO: Düzenleme modalı veya sayfası
  }

  /**
   * Lookup sil - Modal aç
   */
  deleteLookup(lookup: LookupItem): void {
    this.selectedLookup.set(lookup);
    this.deleteModalOpen.set(true);
  }

  /**
   * Delete modal kapat
   */
  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.selectedLookup.set(null);
  }

  /**
   * Silme işlemini onayla
   */
  confirmDelete(): void {
    const lookup = this.selectedLookup();
    if (!lookup) return;

    this.lookupService.deleteById(lookup.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadLookups();
      },
      error: (err) => {
        this.error.set("Silme işlemi başarısız: " + err.message);
        console.error("Delete error:", err);
        this.closeDeleteModal();
      },
    });
  }

  /**
   * Yeni lookup ekle - Modal aç
   */
  onAddLookup(): void {
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
    this.createForm.id.set(null);
    this.createForm.name.set("");
    this.createForm.shortName.set("");
    this.createForm.isActive.set(true);
    this.createFormSubmitting.set(false);
  }

  /**
   * Form validation
   */
  isCreateFormValid(): boolean {
    const id = this.createForm.id();
    const name = this.createForm.name().trim();

    // ID zorunlu ve 3 basamaklı (100-999) olmalı
    if (id === null || id < 100 || id > 999) {
      return false;
    }

    // Name zorunlu
    if (name.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * ID alanı geçerli mi?
   */
  isIdValid(): boolean {
    const id = this.createForm.id();
    return id !== null && id >= 100 && id <= 999;
  }

  /**
   * Yeni lookup oluştur
   */
  submitCreateForm(): void {
    if (!this.isCreateFormValid() || this.createFormSubmitting()) {
      return;
    }

    this.createFormSubmitting.set(true);

    const request = {
      id: this.createForm.id()!,
      name: this.createForm.name().trim(),
      shortName: this.createForm.shortName().trim() || undefined,
      isActive: this.createForm.isActive(),
    };

    this.lookupService.create(request).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadLookups();
      },
      error: (err) => {
        this.error.set("Kayıt oluşturulurken hata oluştu: " + err.message);
        console.error("Create error:", err);
        this.createFormSubmitting.set(false);
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
