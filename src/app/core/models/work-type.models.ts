/**
 * WorkType kaydı (detay)
 * GET /WorkType/{workTypeId} response
 */
export interface WorkTypeItem {
  /** WorkType ID (UUID) */
  id: string;

  /** WorkType adı */
  name: string;

  /** İş Grubu ID (int32) */
  workGroupId: number;

  /** İş Grubu Adı */
  workGroupName?: string | null;

  /** Aktif mi? */
  isActive: boolean;

  /** Oluşturulabilir mi? */
  isCreatable: boolean;

  /** Düzenlenebilir mi? */
  isEditable: boolean;

  /** Genel mi? */
  isGeneral: boolean;
}

/**
 * WorkType liste kaydı
 * GET /WorkType response item
 */
export interface WorkTypeListItem {
  /** WorkType ID (UUID) */
  id: string;

  /** WorkType adı */
  name: string;

  /** İş Grubu Adı */
  workGroupName?: string | null;

  /** Aktif mi? */
  isActive: boolean;

  /** Genel mi? */
  isGeneral: boolean;
}

/**
 * WorkType listesi için query parametreleri
 * GET /WorkType query params
 */
export interface GetWorkTypesRequest {
  /** Sayfa numarası */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** WorkType adı (arama) */
  name?: string;

  /** İş Grubu ID (int32) */
  workGroupId?: number;

  /** Aktif mi? */
  isActive?: boolean;

  /** Oluşturulabilir mi? */
  isCreatable?: boolean;

  /** Genel mi? */
  isGeneral?: boolean;
}

/**
 * Yeni WorkType oluşturma request
 * POST /WorkType body
 */
export interface CreateWorkTypeRequest {
  /** WorkType adı */
  name: string;

  /** İş Grubu ID (int32) */
  workGroupId: number;

  /** Aktif mi? */
  isActive: boolean;

  /** Oluşturulabilir mi? */
  isCreatable: boolean;

  /** Düzenlenebilir mi? */
  isEditable: boolean;

  /** Genel mi? */
  isGeneral: boolean;
}

/**
 * WorkType güncelleme request
 * PUT /WorkType/{workTypeId} body
 */
export interface UpdateWorkTypeRequest {
  /** WorkType ID (UUID) */
  id: string;

  /** WorkType adı */
  name: string;

  /** İş Grubu ID (int32) */
  workGroupId: number;

  /** Aktif mi? */
  isActive: boolean;

  /** Oluşturulabilir mi? */
  isCreatable: boolean;

  /** Düzenlenebilir mi? */
  isEditable: boolean;

  /** Genel mi? */
  isGeneral: boolean;
}

/**
 * WorkType select item
 * Select box için kullanılacak basit model
 */
export interface WorkTypeSelectItem {
  /** WorkType ID (UUID) */
  id: string;

  /** WorkType adı */
  name: string;
}
