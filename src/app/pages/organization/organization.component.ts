import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, debounceTime, distinctUntilChanged } from "rxjs";

import { OrganizationService } from "../../core/services/organization.service";
import { ReferenceService } from "../../core/services/reference.service";
import {
  OrganizationListItem,
  OrganizationSelectItem,
} from "../../core/models/organization.models";
import { ReferenceDataSelectItem } from "../../core/models/reference.models";
import { ReferenceTypes } from "../../core/constants/reference-types";
import { PaginationMeta } from "../../core/models/api.models";

@Component({
  selector: "app-organization",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./organization.component.html",
  styleUrls: ["./organization.component.scss"],
})
export class OrganizationComponent implements OnInit {
  private organizationService = inject(OrganizationService);
  private referenceService = inject(ReferenceService);

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

  // Search ve pagination parametreleri
  searchTerm = signal<string>("");
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  selectedTypeFilter = signal<number | null>(null);

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
      },
      error: (err) => {
        console.error("Parent organizations loading error:", err);
      },
    });
  }

  /**
   * Organization verilerini yükler
   */
  loadOrganizations(): void {
    this.loading.set(true);
    this.error.set(null);

    this.organizationService
      .getAllPaged({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        name: this.searchTerm() || undefined,
        typeId: this.selectedTypeFilter() ?? undefined,
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
   * Type filter değiştiğinde
   */
  onTypeFilterChange(value: number | null): void {
    this.selectedTypeFilter.set(value);
    this.currentPage.set(1);
    this.loadOrganizations();
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
        }
      },
      error: (err) => {
        this.error.set(
          "Organizasyon bilgileri yüklenirken hata oluştu: " + err.message,
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
        this.closeDeleteModal();
        this.loadOrganizations();
      },
      error: (err) => {
        this.error.set("Silme işlemi başarısız: " + err.message);
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
   * Yeni organization oluştur
   */
  submitCreateForm(): void {
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
        this.closeCreateModal();
        this.loadOrganizations();
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
   * Organization güncelle
   */
  submitEditForm(): void {
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
        this.closeEditModal();
        this.loadOrganizations();
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

  /**
   * Organizasyon tipi adını ID'ye göre getir
   */
  getOrganizationTypeName(typeId: number): string {
    const type = this.organizationTypes().find((t) => +t.id === typeId);
    return type?.name ?? "-";
  }
}
