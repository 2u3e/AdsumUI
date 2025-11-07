/**
 * Reference kaydı (eski LookUp)
 * GET /reference/{id} response
 */
export interface ReferenceItem {
  /** Reference ID (integer) */
  id: number;

  /** Reference adı */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Reference listesi için query parametreleri
 * GET /reference/all query params
 */
export interface GetReferencesRequest {
  /** Sayfa numarası (1'den başlar) */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** Arama terimi */
  searchTerm?: string;
}

/**
 * Yeni Reference oluşturma request
 * POST /reference/create body
 */
export interface CreateReferenceRequest {
  /** Reference adı */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Reference güncelleme request
 * PUT /reference/{id} body
 */
export interface UpdateReferenceRequest {
  /** Reference ID (integer) */
  id: number;

  /** Reference adı */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Reference Data kaydı (eski LookUpList)
 * GET /referencedata/{id} response
 */
export interface ReferenceDataItem {
  /** Reference Data ID (UUID) */
  id: string;

  /** Reference ID (UUID) */
  referenceId: string;

  /** Reference Name */
  referenceName?: string;

  /** Name */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Order */
  order?: number;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Reference Data listesi için query parametreleri
 * GET /referencedata/all query params
 */
export interface GetReferenceDataRequest {
  /** Sayfa numarası (1'den başlar) */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** Arama terimi */
  searchTerm?: string;

  /** Reference ID filtresi (UUID) */
  referenceId?: string;
}

/**
 * Yeni Reference Data oluşturma request
 * POST /referencedata body
 */
export interface CreateReferenceDataRequest {
  /** Reference ID (UUID) */
  referenceId: string;

  /** Name */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Order */
  order?: number;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Reference Data güncelleme request
 * PUT /referencedata/{id} body
 */
export interface UpdateReferenceDataRequest {
  /** Reference Data ID (UUID) */
  id: string;

  /** Reference ID (UUID) */
  referenceId: string;

  /** Name */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Order */
  order?: number;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Select için Reference Data
 * GET /referencedata/select/{referenceId} response item
 */
export interface ReferenceDataSelectItem {
  /** ID (UUID) */
  id: string;

  /** Name */
  name: string;
}

/**
 * GET /referencedata/by-reference/{referenceId} response item
 */
export interface ReferenceDataByReferenceItem {
  /** ID (UUID) */
  id: string;

  /** Reference ID (UUID) */
  referenceId: string;

  /** Name */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Order */
  order?: number;

  /** Aktif mi? */
  isActive: boolean;
}
