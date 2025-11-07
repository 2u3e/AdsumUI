# ADSUMUI - Referans Data Yapısı Raporu

**Tarih:** 7 Kasım 2025 | **Proje:** AdsumUI (Angular 19+)

---

## 1. API SERVIS DOSYALARI

### A) ReferenceService
- **Dosya:** `/app/core/services/reference.service.ts`
- **Amaç:** Reference ve ReferenceData verilerini yönetir

**Önemli Metodlar:**
- `getAllPaged()` - Sayfalı referans listesi
- `getDataForSelect(referenceId, isShortName)` - Select için veri
- `getDataByReferenceId(referenceId, onlyActive)` - ID'ye göre veri
- `createData()`, `updateData()`, `deleteDataById()` - CRUD

**Cinsiyet için kullanım:**
```typescript
this.referenceService.getDataForSelect("1", false)
// Döner: ReferenceDataSelectItem[] { id, name }
```

### B) CitizenService
- **Dosya:** `/app/core/services/citizen.service.ts`
- **Amaç:** Vatandaş verilerini yönetir

**Endpoints:**
- `GET /Citizens` - Tüm vatandaşlar
- `POST /Citizens` - Yeni (genderId zorunlu)
- `PUT /Citizens/{id}` - Güncelle
- `DELETE /Citizens/{id}` - Sil

### C) BaseHttpService
- **Dosya:** `/app/core/services/base-http.service.ts`
- **Amaç:** Merkezi HTTP servisi
- **Metotlar:** get(), post(), put(), delete(), patch()

---

## 2. ENUM TANIMLARI

### UserRole (Auth Modeli)
```typescript
export enum UserRole {
  Admin = 'Admin',
  User = 'User',
  Manager = 'Manager'
}
```

### Permission (Auth Modeli)
```typescript
export enum Permission {
  Read = 'Read',
  Write = 'Write',
  Delete = 'Delete',
  Manage = 'Manage'
}
```

**ÖNEMLİ:** Cinsiyet için TypeScript Enum YOK! ReferenceData API (dinamik) kullanılıyor.

---

## 3. CINSIYET ALANI KULLANIMLARI

### CitizenItem Interface
```typescript
interface CitizenItem {
  id: string;
  identityNumber: string;
  name: string;
  lastName: string;
  birthDate: string;
  birthPlace?: string;
  age?: number;
  
  // CINSIYET
  genderId: number;           // Zorunlu
  genderName?: string;        // Readonly
  
  isActive: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
```

### CitizenListItem Interface
```typescript
interface CitizenListItem {
  id: string;
  identityNumber: string;
  fullName: string;
  birthDate: string;
  age: number;
  genderName?: string;        // CINSIYET ADI
  isActive: boolean;
}
```

### CreateCitizenRequest Interface
```typescript
interface CreateCitizenRequest {
  identityNumber: string;
  name: string;
  lastName: string;
  birthDate: string;
  birthPlace?: string;
  genderId: number;           // ZORUNLU
}
```

---

## 4. SELECT/DROPDOWN COMPONENTLERI

### Citizen Component - Cinsiyet Select
**Dosya:** `/app/pages/citizen/citizen.component.html`

```html
<select class="kt-select w-full"
  [ngModel]="createForm.genderId()"
  (ngModelChange)="createForm.genderId.set($event ? +$event : null)"
  [ngModelOptions]="{ standalone: true }"
  [disabled]="createFormSubmitting()"
>
  <option [value]="null">Seçiniz</option>
  @for (gender of genders(); track gender.id) {
    <option [value]="gender.id">{{ gender.name }}</option>
  }
</select>
```

**TypeScript Kodu:**
```typescript
genders = signal<ReferenceDataSelectItem[]>([]);

loadGenders(): void {
  this.referenceService.getDataForSelect("1", false).subscribe({
    next: (response) => {
      this.genders.set(response.data ?? []);
    },
    error: (err) => {
      console.error("Gender loading error:", err);
    },
  });
}

getGenderName(genderId: number): string {
  const gender = this.genders().find((g) => +g.id === genderId);
  return gender?.name ?? "-";
}
```

### Reference/Lookup Components - Page Size Select
```html
<select class="kt-select"
  [value]="pageSize()"
  (change)="onPageSizeChange(+$any($event.target).value)"
>
  <option [value]="10">10</option>
  <option [value]="25">25</option>
  <option [value]="50">50</option>
  <option [value]="100">100</option>
</select>
```

**CSS Class:** `kt-select`

---

## 5. FORM COMPONENTLERI

### A) Citizen Component (Vatandaş Yönetimi)
**Dosya:** `/app/pages/citizen/citizen.component.ts` ve `.html`

**Form Alanları:**
- TC Kimlik Numarası (text, 11 haneli, zorunlu)
- Ad (text, zorunlu)
- Soyad (text, zorunlu)
- Doğum Tarihi (date, zorunlu)
- Doğum Yeri (text, opsiyonel)
- **Cinsiyet (SELECT, zorunlu)** ← ReferenceData "1"

**Modal Tipler:**
- Create Modal
- Delete Modal

**Validasyon:**
```typescript
isCreateFormValid(): boolean {
  const identityNumber = this.createForm.identityNumber().trim();
  const name = this.createForm.name().trim();
  const lastName = this.createForm.lastName().trim();
  const birthDate = this.createForm.birthDate();
  const genderId = this.createForm.genderId();

  // TC No: 11 haneli ve sadece rakam
  if (!/^\d{11}$/.test(identityNumber)) return false;
  
  // Diğer alanlar
  if (!name || !lastName || !birthDate || !genderId) return false;
  
  return true;
}
```

**Input Maskeleme:**
```typescript
onIdentityNumberChange(value: string): void {
  const numericValue = value.replace(/[^0-9]/g, "");
  this.createForm.identityNumber.set(numericValue);
}
```

### B) Reference Component
**Dosya:** `/app/pages/reference/reference.component.ts` ve `.html`

**Form Alanları:**
- Ad (text, zorunlu)
- Kısa Ad (text, opsiyonel)
- Aktif (checkbox)

**Özellikler:** Create, Delete, Pagination, Search

### C) Lookup Component
**Dosya:** `/app/pages/lookup/lookup.component.ts` ve `.html`

**Özellikler:** Create, **Edit**, Delete, Pagination, Search

---

## 6. CSS SINIFLARI

| Sınıf | Amaç |
|-------|------|
| `kt-input` | Text input |
| `kt-select` | Select dropdown |
| `kt-switch` | Checkbox/Toggle |
| `kt-btn` | Base button |
| `kt-btn-primary` | Primary button |
| `kt-btn-outline` | Outline button |
| `kt-btn-ghost` | Ghost button |
| `kt-btn-icon` | Icon button |
| `kt-card` | Card container |
| `kt-table` | Table element |
| `kt-badge-success` | Success badge |
| `kt-badge-destructive` | Error badge |

---

## 7. REFERANS DATA MODEL TIPLERİ

### ReferenceItem
```typescript
interface ReferenceItem {
  id: number;
  name: string;
  shortName?: string;
  isActive: boolean;
}
```

### ReferenceDataItem
```typescript
interface ReferenceDataItem {
  id: string;              // UUID
  referenceId: string;     // UUID
  referenceName?: string;
  name: string;
  shortName?: string;
  order?: number;
  isActive: boolean;
}
```

### ReferenceDataSelectItem (Optimize edilmiş)
```typescript
interface ReferenceDataSelectItem {
  id: string;              // UUID
  name: string;
}
```

---

## 8. VERİ AKIŞI DİYAGRAMI

```
CINSIYET YÜKLEME VE KULLANIM:

Component Init
    ↓
loadGenders()
    ↓
referenceService.getDataForSelect("1", false)
    ↓
GET /referencedata/select/1
    ↓
Response: ReferenceDataSelectItem[]
    ↓
genders signal → Template
    ↓
User selects → genderId signal set
    ↓
Form Submit
    ↓
CreateCitizenRequest { genderId: 2, ... }
    ↓
citizenService.create(request)
    ↓
POST /Citizens
    ↓
Success → loadCitizens() (Refresh)
```

---

## 9. MODEL DOSYALARI YAPISI

```
/app/core/models/
├── reference.models.ts (Reference + ReferenceData)
├── citizen.models.ts (Citizen + genderId, genderName)
├── api.models.ts (Response<T>, PaginationMeta, ErrorDetail)
└── auth.models.ts (UserRole, Permission enums)
```

---

## 10. ÖNERİLER

1. **Cinsiyet Enum (İsteğe bağlı):**
   ```typescript
   export enum Gender {
     Female = 1,
     Male = 2,
     Other = 3
   }
   ```

2. **Reference ID Constants:**
   ```typescript
   export const REFERENCE_IDS = {
     GENDER: "1",
     NATIONALITY: "2",
   };
   ```

3. **Select Helper Component:** Reusable dropdown component

4. **Veri Caching:** Cinsiyet gibi sık kullanılan veri cache'le

5. **Tür Güvenliği:** genderId tipi kontrol (number vs UUID)

---

**Rapor Hazırlayan:** Claude Code Analysis Agent  
**Versiyon:** 1.0 | **Tarih:** 7 Kasım 2025
