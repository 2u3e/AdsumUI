/**
 * Generic API Response Wrapper
 * Tüm API yanıtları için kullanılacak merkezi tip
 */
export interface Response<T = any> {
  /** HTTP durum kodu */
  statusCode: number;

  /** Kullanıcıya veya istemciye gösterilecek mesaj */
  message?: string;

  /** İşlem çıktısı. Boş ise null döner */
  data?: T;

  /** Hata detayları */
  errors?: ErrorDetail[];

  /** Sayfalama meta verisi (yalnızca koleksiyon dönerken set edilir) */
  pagination?: PaginationMeta;

  /** Dağıtık izleme / log korelasyonu için TraceId */
  correlationId?: string;

  /** Cevabın üretildiği zaman (UTC) */
  timestampUtc: string;
}

/**
 * Hata detayı
 */
export interface ErrorDetail {
  /** Hata kodu */
  code?: string;

  /** Hata mesajı */
  message: string;

  /** Hatalı alan adı (validasyon hataları için) */
  field?: string;

  /** Ek detaylar */
  details?: any;
}

/**
 * Sayfalama meta verisi
 */
export interface PaginationMeta {
  /** Mevcut sayfa numarası (API: page) */
  page?: number;

  /** Mevcut sayfa numarası (alternatif) */
  currentPage?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize: number;

  /** Toplam kayıt sayısı (API: totalItems) */
  totalItems?: number;

  /** Toplam kayıt sayısı (alternatif) */
  totalCount?: number;

  /** Toplam kayıt sayısı (alternatif 2) */
  totalItem?: number;

  /** Toplam sayfa sayısı */
  totalPages: number;

  /** Bir sonraki sayfa var mı? */
  hasNextPage?: boolean;

  /** Bir önceki sayfa var mı? */
  hasPreviousPage?: boolean;
}

/**
 * Sayfalı API istekleri için query parametreleri
 */
export interface PagedRequest {
  /** Sayfa numarası (1'den başlar) */
  pageNumber?: number;

  /** Sayfa başına kayıt sayısı */
  pageSize?: number;

  /** Arama terimi */
  searchTerm?: string;

  /** Sıralama alanı */
  orderBy?: string;

  /** Sıralama yönü (asc/desc) */
  orderDirection?: "asc" | "desc";
}

/**
 * API isteği için base options
 */
export interface ApiRequestOptions {
  /** İstekte gönderilecek header'lar */
  headers?: Record<string, string>;

  /** Query parametreleri */
  params?: Record<string, any>;

  /** İsteği iptal etmek için kullanılacak signal */
  signal?: AbortSignal;
}

/**
 * API yanıtının başarılı olup olmadığını kontrol eder
 */
export function isSuccessResponse<T>(response: Response<T>): boolean {
  return response.statusCode >= 200 && response.statusCode < 300;
}

/**
 * API yanıtından veri çıkartır, hata durumunda exception fırlatır
 */
export function extractData<T>(response: Response<T>): T {
  if (!isSuccessResponse(response)) {
    const errorMessage =
      response.errors?.map((e) => e.message).join(", ") ||
      response.message ||
      "Bilinmeyen bir hata oluştu";
    throw new Error(errorMessage);
  }

  if (response.data === undefined || response.data === null) {
    throw new Error("API yanıtında data bulunamadı");
  }

  return response.data;
}
