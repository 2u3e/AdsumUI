/**
 * Lookup kaydı
 */
export interface LookupItem {
  /** Lookup ID */
  id: number;

  /** Lookup adı */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Lookup listesi için query parametreleri
 */
export interface GetLookupsRequest {
  /** Sayfa numarası (1'den başlar) */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** Arama terimi */
  searchTerm?: string;
}

/**
 * Yeni Lookup oluşturma request
 */
export interface CreateLookupRequest {
  /** Lookup adı */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Lookup güncelleme request
 */
export interface UpdateLookupRequest {
  /** Lookup ID */
  id: number;

  /** Lookup adı */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Aktif mi? */
  isActive: boolean;
}
