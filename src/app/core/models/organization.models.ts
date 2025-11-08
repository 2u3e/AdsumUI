/**
 * Organization kaydı (detay)
 * GET /Organizations/{id} response
 */
export interface OrganizationItem {
  /** Organization ID (UUID) */
  id: string;

  /** Üst organizasyon ID */
  parentId?: string | null;

  /** Üst organizasyon adı */
  parentName?: string | null;

  /** Organizasyon tipi ID */
  typeId: number;

  /** Organizasyon tipi adı */
  typeName?: string;

  /** Organizasyon adı */
  name: string;

  /** Kısa ad */
  shortName?: string;

  /** Kod */
  code?: string;

  /** Seviye */
  level: number;

  /** Açıklama */
  description?: string;

  /** Aktif mi? */
  isActive: boolean;

  /** Alt organizasyonlar */
  children?: OrganizationItem[];
}

/**
 * Organization liste kaydı
 * GET /Organizations/all response item
 */
export interface OrganizationListItem {
  /** Organization ID (UUID) */
  id: string;

  /** Organizasyon adı */
  name: string;

  /** Üst organizasyon adı */
  parentName?: string | null;

  /** Organizasyon tipi adı */
  typeName?: string;

  /** Kısa ad */
  shortName?: string;

  /** Kod */
  code?: string;

  /** Açıklama */
  description?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Organization listesi için query parametreleri
 * GET /Organizations/all query params
 */
export interface GetOrganizationsRequest {
  /** Sayfa numarası */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** Üst organizasyon ID */
  parentId?: string;

  /** Organizasyon ID */
  organizationId?: string;

  /** Organizasyon adı (arama) */
  name?: string;

  /** Kısa ad (arama) */
  shortName?: string;

  /** Organizasyon tipi ID */
  typeId?: number;
}

/**
 * Yeni Organization oluşturma request
 * POST /Organizations body
 */
export interface CreateOrganizationRequest {
  /** Üst organizasyon ID */
  parentId?: string | null;

  /** Organizasyon tipi ID */
  typeId: number;

  /** Organizasyon adı */
  name: string;

  /** Kısa ad */
  shortName?: string;

  /** Kod */
  code?: string;

  /** Açıklama */
  description?: string;

  /** Aktif mi? */
  isActive: boolean;
}

/**
 * Organization güncelleme request
 * PUT /Organizations/{id} body
 */
export interface UpdateOrganizationRequest {
  /** Organization ID (UUID) */
  id: string;

  /** Üst organizasyon ID */
  parentId?: string | null;

  /** Organizasyon tipi ID */
  typeId: number;

  /** Organizasyon adı */
  name: string;

  /** Kısa ad */
  shortName?: string;

  /** Kod */
  code?: string;

  /** Açıklama */
  description?: string;

  /** Aktif mi? */
  isActive: boolean;
}
