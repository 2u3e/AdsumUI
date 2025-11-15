/**
 * Permission liste kaydı
 * GET /Menus/permissions response item
 */
export interface PermissionListItem {
  /** Permission ID */
  id: number;

  /** Permission adı */
  name: string;

  /** Permission kodu */
  code: string;

  /** Açıklama */
  description?: string | null;
}

/**
 * Permission listesi için query parametreleri
 * GET /Menus/permissions query params
 */
export interface GetPermissionsRequest {
  /** Sayfa numarası */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** Aktif mi? */
  isActive?: boolean;
}
