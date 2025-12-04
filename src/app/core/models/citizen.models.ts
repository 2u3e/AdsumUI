/**
 * Citizen kaydı (detay)
 * GET /Citizens/{id} response
 */
export interface CitizenItem {
  /** Citizen ID (UUID) */
  id: string;

  /** TC Kimlik Numarası */
  identityNumber: string;

  /** Ad */
  name: string;

  /** Soyad */
  lastName: string;

  /** Tam Ad (readonly) */
  fullName?: string;

  /** Doğum Tarihi */
  birthDate: string;

  /** Doğum Yeri */
  birthPlace?: string;

  /** Yaş (readonly) */
  age?: number;

  /** Aktif mi? */
  isActive: boolean;

  /** Oluşturma Tarihi */
  createdAt?: string;

  /** Oluşturan Kullanıcı ID */
  createdBy?: string;

  /** Güncelleme Tarihi */
  updatedAt?: string;

  /** Güncelleyen Kullanıcı ID */
  updatedBy?: string;
}

/**
 * Citizen liste kaydı
 * GET /Citizens/all response item
 */
export interface CitizenListItem {
  /** Citizen ID (UUID) */
  id: string;

  /** TC Kimlik Numarası */
  identityNumber: string;

  /** Ad */
  name: string;

  /** Soyad */
  lastName: string;

  /** Tam Ad */
  fullName: string;

  /** Doğum Tarihi */
  birthDate: string;

  /** Doğum Yeri */
  birthPlace?: string;

  /** Yaş */
  age: number;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Citizen listesi için query parametreleri
 * GET /Citizens/all query params
 */
export interface GetCitizensRequest {
  /** Sayfa numarası */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** TC Kimlik Numarası (arama) */
  identityNumber?: string;

  /** Ad (arama) */
  name?: string;

  /** Soyad (arama) */
  lastName?: string;

  /** Sadece aktif kayıtlar mı? */
  isActive?: boolean;
}

/**
 * Yeni Citizen oluşturma request
 * POST /Citizens body
 */
export interface CreateCitizenRequest {
  /** TC Kimlik Numarası */
  identityNumber: string;

  /** Ad */
  name: string;

  /** Soyad */
  lastName: string;

  /** Doğum Tarihi */
  birthDate: string;

  /** Doğum Yeri */
  birthPlace?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Citizen güncelleme request
 * PUT /Citizens/{id} body
 */
export interface UpdateCitizenRequest {
  /** Citizen ID (UUID) */
  id: string;

  /** Ad */
  name: string;

  /** Soyad */
  lastName: string;

  /** Doğum Tarihi */
  birthDate: string;

  /** Doğum Yeri */
  birthPlace?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Citizen select item
 * Select box için kullanılacak basit model
 */
export interface CitizenSelectItem {
  /** Citizen ID (UUID) */
  id: string;

  /** Tam Ad */
  fullName: string;

  /** TC Kimlik Numarası */
  identityNumber: string;
}
