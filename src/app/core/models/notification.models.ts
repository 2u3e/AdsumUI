/**
 * Notification Models
 * Toast/Alert notification sistemi için model tanımlamaları
 */

/**
 * Notification türleri
 */
export enum NotificationType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Primary = 'primary',
}

/**
 * Notification pozisyonları
 */
export enum NotificationPosition {
  TopRight = 'top-right',
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  BottomRight = 'bottom-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
}

/**
 * Notification animasyon türleri
 */
export enum NotificationAnimation {
  Fade = 'fade',
  Slide = 'slide',
  Bounce = 'bounce',
  Zoom = 'zoom',
}

/**
 * Notification konfigürasyonu
 */
export interface NotificationConfig {
  /** Notification'ın otomatik kapanma süresi (ms). 0 ise otomatik kapanmaz */
  duration?: number;

  /** Notification pozisyonu */
  position?: NotificationPosition;

  /** Animasyon türü */
  animation?: NotificationAnimation;

  /** Kapatma butonu gösterilsin mi? */
  showCloseButton?: boolean;

  /** Progress bar gösterilsin mi? */
  showProgressBar?: boolean;

  /** Tıklanınca kapansın mı? */
  closeOnClick?: boolean;

  /** Pause on hover (süre duraksın mı?) */
  pauseOnHover?: boolean;

  /** Icon gösterilsin mi? */
  showIcon?: boolean;

  /** Özel CSS class */
  customClass?: string;

  /** En son eklenen en üstte mi gösterilsin? */
  newestOnTop?: boolean;
}

/**
 * Notification verisi
 */
export interface Notification {
  /** Benzersiz ID */
  id: string;

  /** Notification türü */
  type: NotificationType;

  /** Başlık */
  title?: string;

  /** Mesaj içeriği */
  message: string;

  /** Konfigürasyon */
  config: Required<NotificationConfig>;

  /** Oluşturulma zamanı */
  createdAt: Date;

  /** Görünürlük durumu */
  visible: boolean;

  /** Progress yüzdesi (0-100) */
  progress?: number;
}

/**
 * Default notification konfigürasyonu
 */
export const DEFAULT_NOTIFICATION_CONFIG: Required<NotificationConfig> = {
  duration: 5000,
  position: NotificationPosition.TopRight,
  animation: NotificationAnimation.Slide,
  showCloseButton: true,
  showProgressBar: true,
  closeOnClick: false,
  pauseOnHover: true,
  showIcon: true,
  customClass: '',
  newestOnTop: true,
};

/**
 * Notification icon mapping
 */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  [NotificationType.Success]: 'check-circle',
  [NotificationType.Error]: 'cross-circle',
  [NotificationType.Warning]: 'information-circle',
  [NotificationType.Info]: 'information-circle',
  [NotificationType.Primary]: 'abstract-26',
};

/**
 * HTTP Hata yanıtı için ProblemDetails yapısı
 * ASP.NET Core RFC 7807 standardına uygun
 */
export interface ProblemDetails {
  /** Hata tipi URI */
  type?: string;

  /** HTTP durum başlığı */
  title?: string;

  /** HTTP durum kodu */
  status?: number;

  /** Kullanıcıya gösterilecek detaylı açıklama */
  detail?: string;

  /** Hatanın oluştuğu instance URI */
  instance?: string;

  /** Ek özellikler */
  [key: string]: any;

  /** Validasyon hataları (ASP.NET Core extension) */
  errors?: Record<string, string[]>;

  /** Trace ID */
  traceId?: string;
}
