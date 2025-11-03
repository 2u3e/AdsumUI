/**
 * Reference kaydı (eski LookUp)
 */
export interface ReferenceItem {
  /** Reference ID (UUID) */
  id: string;

  /** Business ID */
  businessId: number;

  /** Reference adı */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Reference listesi için query parametreleri
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
 */
export interface CreateReferenceRequest {
  /** Business ID */
  businessId: number;

  /** Reference adı */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Reference güncelleme request
 */
export interface UpdateReferenceRequest {
  /** Reference ID (UUID) */
  id: string;

  /** Business ID */
  businessId: number;

  /** Reference adı */
  name: string;

  /** Kısa adı (opsiyonel) */
  shortName?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Reference Data kaydı (eski LookUpList)
 */
export interface ReferenceDataItem {
  /** Reference Data ID (UUID) */
  id: string;

  /** Business ID */
  businessId: number;

  /** Reference Business ID */
  referenceBusinessId: number;

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
 */
export interface GetReferenceDataRequest {
  /** Sayfa numarası (1'den başlar) */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** Arama terimi */
  searchTerm?: string;

  /** Reference Business ID filtresi */
  referenceBusinessId?: number;
}

/**
 * Yeni Reference Data oluşturma request
 */
export interface CreateReferenceDataRequest {
  /** Business ID */
  businessId: number;

  /** Reference Business ID */
  referenceBusinessId: number;

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
 */
export interface UpdateReferenceDataRequest {
  /** Reference Data ID (UUID) */
  id: string;

  /** Business ID */
  businessId: number;

  /** Reference Business ID */
  referenceBusinessId: number;

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
 */
export interface ReferenceDataSelectItem {
  /** ID (UUID) */
  id: string;

  /** Name */
  name: string;
}
