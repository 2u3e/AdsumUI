/**
 * Rol kaydı (detay)
 * GET /Roles/{id} response
 */
export interface RoleResponse {
  /** Rol ID (UUID) */
  id: string;

  /** Rol adı */
  name: string;

  /** Sistem rolü mü? */
  isSystem: boolean;

  /** Menü-Permission ID'leri (MenuPermission tablodaki kayıtların ID'leri) */
  menuPermissionIds?: string[] | null;
}

/**
 * Rol liste kaydı
 * GET /Roles/all response item
 */
export interface RoleListItem {
  /** Rol ID (UUID) */
  id: string;

  /** Rol adı */
  name: string;

  /** Sistem rolü mü? */
  isSystem: boolean;
}

/**
 * Rol listesi için query parametreleri
 * GET /Roles/all query params
 */
export interface GetRolesRequest {
  /** Sayfa numarası */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** Rol adı (arama) */
  name?: string;

  /** Sistem rolü mü? */
  isSystem?: boolean;
}

/**
 * Yeni Rol oluşturma request
 * POST /Roles body
 */
export interface CreateRoleRequest {
  /** Rol adı */
  name: string;

  /** Menü-Permission ID'leri */
  menuPermissionIds?: string[] | null;
}

/**
 * Rol güncelleme request
 * PUT /Roles/{id} body
 */
export interface UpdateRoleRequest {
  /** Rol ID (UUID) */
  id: string;

  /** Rol adı */
  name: string;

  /** Menü-Permission ID'leri */
  menuPermissionIds?: string[] | null;
}

/**
 * Rol select item
 * GET /Roles/getallforselect response item
 */
export interface RoleSelectItem {
  /** Rol ID (UUID) */
  id: string;

  /** Rol adı */
  name: string;
}
