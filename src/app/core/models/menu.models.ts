/**
 * Menu Types Enum
 * API'deki MenuTypes enum'ına karşılık gelir
 */
export enum MenuTypes {
  /** Menü */
  Menu = 1,
  /** Sayfa */
  Page = 2,
  /** Buton */
  Button = 3,
}

/**
 * Menu kaydı (detay)
 * GET /Menus/{id} response
 */
export interface MenuResponse {
  /** Menu ID (UUID) */
  id: string;

  /** Üst menu ID */
  parentId?: string | null;

  /** Menu kodu */
  code: string;

  /** Menu adı */
  name: string;

  /** Menu tipi ID */
  typeId: MenuTypes;

  /** Menu tipi adı */
  typeName?: string | null;

  /** Route/URL */
  route?: string | null;

  /** İkon */
  icon?: string | null;

  /** Sıralama */
  order: number;

  /** Aktif mi? */
  isActive: boolean;

  /** Görünür mü? */
  isVisible: boolean;

  /** Açıklama */
  description?: string | null;

  /** İzin ID'leri */
  permissionIds?: number[] | null;

  /** Oluşturulma tarihi */
  createdAt: string;

  /** Güncellenme tarihi */
  updatedAt?: string | null;
}

/**
 * Menu liste kaydı
 * GET /Menus response item
 */
export interface MenuListItem {
  /** Menu ID (UUID) */
  id: string;

  /** Menu kodu */
  code: string;

  /** Menu adı */
  name: string;

  /** Menu tipi ID */
  typeId: MenuTypes;

  /** Menu tipi adı */
  typeName?: string | null;

  /** Üst menu adı */
  parentName?: string | null;

  /** Route/URL */
  route?: string | null;

  /** İkon */
  icon?: string | null;

  /** Sıralama */
  order: number;

  /** Aktif mi? */
  isActive: boolean;

  /** Görünür mü? */
  isVisible: boolean;

  /** Açıklama */
  description?: string | null;
}

/**
 * Menu listesi için query parametreleri
 * GET /Menus query params
 */
export interface GetMenusRequest {
  /** Sayfa numarası */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** Üst menu ID */
  parentId?: string;

  /** Menu kodu (arama) */
  code?: string;

  /** Menu adı (arama) */
  name?: string;

  /** Menu tipi */
  menuType?: MenuTypes;

  /** Aktif mi? */
  isActive?: boolean;

  /** Görünür mü? */
  isVisible?: boolean;
}

/**
 * Yeni Menu oluşturma request
 * POST /Menus body
 */
export interface CreateMenuRequest {
  /** Üst menu ID */
  parentId?: string | null;

  /** Menu kodu */
  code: string;

  /** Menu adı */
  name: string;

  /** Menu tipi ID */
  typeId: MenuTypes;

  /** Route/URL */
  route?: string | null;

  /** İkon */
  icon?: string | null;

  /** Sıralama */
  order: number;

  /** Aktif mi? */
  isActive: boolean;

  /** Görünür mü? */
  isVisible: boolean;

  /** Açıklama */
  description?: string | null;

  /** İzin ID'leri */
  permissionIds?: number[] | null;
}

/**
 * Menu güncelleme request
 * PUT /Menus/{id} body
 */
export interface UpdateMenuRequest {
  /** Menu ID (UUID) */
  id: string;

  /** Üst menu ID */
  parentId?: string | null;

  /** Menu kodu */
  code: string;

  /** Menu adı */
  name: string;

  /** Menu tipi ID */
  typeId: MenuTypes;

  /** Route/URL */
  route?: string | null;

  /** İkon */
  icon?: string | null;

  /** Sıralama */
  order: number;

  /** Aktif mi? */
  isActive: boolean;

  /** Görünür mü? */
  isVisible: boolean;

  /** Açıklama */
  description?: string | null;

  /** İzin ID'leri */
  permissionIds?: number[] | null;
}

/**
 * Menu select item
 * Select box için kullanılacak basit model
 */
export interface MenuSelectItem {
  /** Menu ID (UUID) */
  id: string;

  /** Menu adı */
  name: string;

  /** Menu kodu */
  code?: string;
}
