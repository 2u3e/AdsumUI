/**
 * Citizen kaydı
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

  /** Cinsiyet ID */
  genderId: number;

  /** Cinsiyet Adı */
  genderName?: string;

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
 * GET /Citizens response item
 */
export interface CitizenListItem {
  /** Citizen ID (UUID) */
  id: string;

  /** TC Kimlik Numarası */
  identityNumber: string;

  /** Tam Ad */
  fullName: string;

  /** Doğum Tarihi */
  birthDate: string;

  /** Yaş */
  age: number;

  /** Cinsiyet Adı */
  genderName?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Citizen listesi için query parametreleri
 * GET /Citizens query params
 */
export interface GetCitizensRequest {
  /** Sadece aktif kayıtlar mı? */
  onlyActive?: boolean;
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

  /** Cinsiyet ID */
  genderId: number;
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

  /** Cinsiyet ID */
  genderId: number;

  /** Aktif mi? */
  isActive: boolean;
}
