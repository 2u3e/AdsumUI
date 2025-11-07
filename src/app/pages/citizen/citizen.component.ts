import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, debounceTime, distinctUntilChanged } from "rxjs";

import { CitizenService } from "../../core/services/citizen.service";
import { ReferenceService } from "../../core/services/reference.service";
import { CitizenListItem } from "../../core/models/citizen.models";
import { ReferenceDataSelectItem } from "../../core/models/reference.models";
import { ReferenceTypes } from "../../core/constants/reference-types";

@Component({
  selector: "app-citizen",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./citizen.component.html",
  styleUrls: ["./citizen.component.scss"],
})
export class CitizenComponent implements OnInit {
  private citizenService = inject(CitizenService);
  private referenceService = inject(ReferenceService);

  // Signals
  citizens = signal<CitizenListItem[]>([]);
  allCitizens = signal<CitizenListItem[]>([]); // Tüm data (filtreleme için)
  genders = signal<ReferenceDataSelectItem[]>([]);
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
    genderId: signal<number | null>(null),
  };
  createFormSubmitting = signal<boolean>(false);

  // Edit form
  editForm = {
    id: signal<string>(""),
    name: signal<string>(""),
    lastName: signal<string>(""),
    birthDate: signal<string>(""),
    birthPlace: signal<string>(""),
    genderId: signal<number | null>(null),
    isActive: signal<boolean>(true),
  };
  editFormSubmitting = signal<boolean>(false);

  // Filter parametreleri
  searchTerm = signal<string>("");
  onlyActive = signal<boolean>(true);

  // Search debounce için
  private searchSubject = new Subject<string>();

  // Computed values
  totalCount = computed(() => this.citizens().length);
  activeCount = computed(
    () => this.citizens().filter((c) => c.isActive).length,
  );

  // Filtrelenmiş vatandaşlar
  filteredCitizens = computed(() => {
    let filtered = [...this.allCitizens()];

    // Aktif filtresi
    if (this.onlyActive()) {
      filtered = filtered.filter((c) => c.isActive);
    }

    // Arama filtresi
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(search) ||
          c.identityNumber.includes(search) ||
          c.genderName?.toLowerCase().includes(search),
      );
    }

    return filtered;
  });

  ngOnInit(): void {
    // Search debounce setup
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchTerm.set(searchTerm);
      });

    // Cinsiyet listesini yükle
    this.loadGenders();

    // İlk yükleme
    this.loadCitizens();
  }

  /**
   * Cinsiyet listesini yükler
   * ReferenceId = 105 (GenderType)
   */
  loadGenders(): void {
    this.referenceService
      .getDataForSelect(ReferenceTypes.GenderType.toString(), false)
      .subscribe({
        next: (response) => {
          this.genders.set(response.data ?? []);
        },
        error: (err) => {
          console.error("Gender loading error:", err);
        },
      });
  }

  /**
   * Citizen verilerini yükler
   */
  loadCitizens(): void {
    this.loading.set(true);
    this.error.set(null);

    this.citizenService
      .getAll({
        onlyActive: false, // Tüm kayıtları al, frontend'de filtrele
      })
      .subscribe({
        next: (response) => {
          const data = response.data ?? [];
          this.allCitizens.set(data);
          this.citizens.set(data);
          this.loading.set(false);
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
   * Aktif filtresi değiştiğinde
   */
  onOnlyActiveChange(value: boolean): void {
    this.onlyActive.set(value);
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
          this.editForm.genderId.set(citizenData.genderId);
          this.editForm.isActive.set(citizenData.isActive);
          this.editModalOpen.set(true);
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
        this.closeDeleteModal();
        this.loadCitizens();
      },
      error: (err) => {
        this.error.set("Silme işlemi başarısız: " + err.message);
        console.error("Delete error:", err);
        this.closeDeleteModal();
      },
    });
  }

  /**
   * TC Kimlik No değişikliğinde - Sadece rakam girişine izin ver
   */
  onIdentityNumberChange(value: string): void {
    // Sadece rakamları al
    const numericValue = value.replace(/[^0-9]/g, "");
    this.createForm.identityNumber.set(numericValue);
  }

  /**
   * Yeni citizen ekle - Modal aç
   */
  onAddCitizen(): void {
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
    this.createForm.identityNumber.set("");
    this.createForm.name.set("");
    this.createForm.lastName.set("");
    this.createForm.birthDate.set("");
    this.createForm.birthPlace.set("");
    this.createForm.genderId.set(null);
    this.createFormSubmitting.set(false);
  }

  /**
   * Form validation
   */
  isCreateFormValid(): boolean {
    const identityNumber = this.createForm.identityNumber().trim();
    const name = this.createForm.name().trim();
    const lastName = this.createForm.lastName().trim();
    const birthDate = this.createForm.birthDate();
    const genderId = this.createForm.genderId();

    // Zorunlu alanlar
    if (
      identityNumber.length !== 11 ||
      name.length === 0 ||
      lastName.length === 0 ||
      !birthDate ||
      !genderId
    ) {
      return false;
    }

    // TC Kimlik No kontrol (sayı olmalı)
    if (!/^\d{11}$/.test(identityNumber)) {
      return false;
    }

    return true;
  }

  /**
   * Yeni citizen oluştur
   */
  submitCreateForm(): void {
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
      genderId: this.createForm.genderId()!,
    };

    this.citizenService.create(request).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadCitizens();
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
    this.editForm.genderId.set(null);
    this.editForm.isActive.set(true);
    this.editFormSubmitting.set(false);
  }

  /**
   * Edit form validation
   */
  isEditFormValid(): boolean {
    const name = this.editForm.name().trim();
    const lastName = this.editForm.lastName().trim();
    const birthDate = this.editForm.birthDate();
    const genderId = this.editForm.genderId();
    const id = this.editForm.id();

    return (
      id.length > 0 &&
      name.length > 0 &&
      lastName.length > 0 &&
      !!birthDate &&
      !!genderId
    );
  }

  /**
   * Citizen güncelle
   */
  submitEditForm(): void {
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
      genderId: this.editForm.genderId()!,
      isActive: this.editForm.isActive(),
    };

    this.citizenService.update(request.id, request).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadCitizens();
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
   * Cinsiyet adını ID'ye göre getir
   */
  getGenderName(genderId: number): string {
    const gender = this.genders().find((g) => +g.id === genderId);
    return gender?.name ?? "-";
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
}
