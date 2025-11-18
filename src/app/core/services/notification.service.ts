import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, interval } from "rxjs";
import {
  Notification,
  NotificationConfig,
  NotificationType,
  DEFAULT_NOTIFICATION_CONFIG,
  ProblemDetails,
} from "../models/notification.models";
import { Response, ErrorDetail } from "../models/api.models";

/**
 * Notification Service
 * Uygulama genelinde toast/notification yönetimi için merkezi servis
 */
@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private notificationIdCounter = 0;

  /**
   * Aktif notification'ları observable olarak döner
   */
  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  /**
   * Başarı notification'ı gösterir
   */
  success(
    message: string,
    title?: string,
    config?: Partial<NotificationConfig>,
  ): string {
    return this.show(NotificationType.Success, message, title, config);
  }

  /**
   * Hata notification'ı gösterir
   */
  error(
    message: string,
    title?: string,
    config?: Partial<NotificationConfig>,
  ): string {
    return this.show(NotificationType.Error, message, title, config);
  }

  /**
   * Uyarı notification'ı gösterir
   */
  warning(
    message: string,
    title?: string,
    config?: Partial<NotificationConfig>,
  ): string {
    return this.show(NotificationType.Warning, message, title, config);
  }

  /**
   * Bilgi notification'ı gösterir
   */
  info(
    message: string,
    title?: string,
    config?: Partial<NotificationConfig>,
  ): string {
    return this.show(NotificationType.Info, message, title, config);
  }

  /**
   * Primary notification gösterir
   */
  primary(
    message: string,
    title?: string,
    config?: Partial<NotificationConfig>,
  ): string {
    return this.show(NotificationType.Primary, message, title, config);
  }

  /**
   * API Response'dan otomatik notification gösterir
   */
  fromApiResponse<T>(response: Response<T>): void {
    if (!response) return;

    // Başarılı response
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.message) {
        this.success(response.message);
      }
      return;
    }

    // Hatalı response
    if (response.errors && response.errors.length > 0) {
      this.fromErrorDetails(response.errors);
    } else if (response.message) {
      this.error(response.message);
    }
  }

  /**
   * ErrorDetail array'inden notification'lar oluşturur
   */
  fromErrorDetails(errors: ErrorDetail[]): void {
    if (!errors || errors.length === 0) return;

    errors.forEach((error) => {
      const title = error.field ? `${error.field}` : undefined;
      const message = error.message || "Bilinmeyen hata";
      this.error(message, title, {
        duration: 7000, // Hata mesajları biraz daha uzun kalsın
      });
    });
  }

  /**
   * ProblemDetails'den notification oluşturur
   */
  fromProblemDetails(problem: ProblemDetails): void {
    if (!problem) return;

    const title = problem.title || "Hata";
    const message = problem.detail || "Bir hata oluştu";

    // Validasyon hataları varsa
    if (problem.errors && Object.keys(problem.errors).length > 0) {
      Object.entries(problem.errors).forEach(([field, messages]) => {
        // messages string veya array olabilir
        const messageArray = Array.isArray(messages) ? messages : [messages];
        messageArray.forEach((msg) => {
          this.error(String(msg), field, { duration: 7000 });
        });
      });
    } else {
      // Tek bir hata mesajı
      this.error(message, title, { duration: 7000 });
    }
  }

  /**
   * HTTP hata yanıtından otomatik notification gösterir
   */
  fromHttpError(error: any): void {
    // ProblemDetails formatı kontrolü
    if (error?.error && this.isProblemDetails(error.error)) {
      this.fromProblemDetails(error.error);
      return;
    }

    // Response formatı kontrolü
    if (error?.error && this.isApiResponse(error.error)) {
      this.fromApiResponse(error.error);
      return;
    }

    // Genel hata mesajı
    const message =
      error?.error?.message ||
      error?.message ||
      error?.error?.detail ||
      "Bir hata oluştu. Lütfen tekrar deneyin.";

    const title =
      error?.error?.title || (error?.status ? `Hata ${error.status}` : "Hata");

    this.error(message, title);
  }

  /**
   * Genel notification gösterir
   */
  show(
    type: NotificationType,
    message: string,
    title?: string,
    config?: Partial<NotificationConfig>,
  ): string {
    const notification = this.createNotification(type, message, title, config);

    const currentNotifications = this.notifications$.value;

    // Newest on top kontrolü
    if (notification.config.newestOnTop) {
      this.notifications$.next([notification, ...currentNotifications]);
    } else {
      this.notifications$.next([...currentNotifications, notification]);
    }

    // Otomatik kapatma
    if (notification.config.duration > 0) {
      this.scheduleAutoClose(notification);
    }

    return notification.id;
  }

  /**
   * Notification'ı ID ile kapatır
   */
  close(id: string): void {
    const notifications = this.notifications$.value;
    const notification = notifications.find((n) => n.id === id);

    if (notification) {
      // Önce görünürlüğü kapat (animasyon için)
      notification.visible = false;
      this.notifications$.next([...notifications]);

      // Animasyon tamamlandıktan sonra listeden kaldır
      setTimeout(() => {
        this.remove(id);
      }, 300); // Animasyon süresi
    }
  }

  /**
   * Notification'ı listeden kaldırır
   */
  private remove(id: string): void {
    const notifications = this.notifications$.value.filter((n) => n.id !== id);
    this.notifications$.next(notifications);
  }

  /**
   * Tüm notification'ları kapatır
   */
  closeAll(): void {
    const notifications = this.notifications$.value;
    notifications.forEach((n) => {
      n.visible = false;
    });
    this.notifications$.next([...notifications]);

    setTimeout(() => {
      this.notifications$.next([]);
    }, 300);
  }

  /**
   * Notification oluşturur
   */
  private createNotification(
    type: NotificationType,
    message: string,
    title?: string,
    config?: Partial<NotificationConfig>,
  ): Notification {
    const mergedConfig = {
      ...DEFAULT_NOTIFICATION_CONFIG,
      ...config,
    };

    return {
      id: this.generateId(),
      type,
      title,
      message,
      config: mergedConfig,
      createdAt: new Date(),
      visible: true,
      progress: mergedConfig.showProgressBar ? 100 : undefined,
    };
  }

  /**
   * Otomatik kapatma zamanlayıcısını başlatır
   */
  private scheduleAutoClose(notification: Notification): void {
    const duration = notification.config.duration;
    if (duration <= 0) return;

    // Progress bar için interval
    if (notification.config.showProgressBar) {
      const updateInterval = 50; // 50ms'de bir güncelle
      const totalSteps = duration / updateInterval;
      let currentStep = 0;

      const progressInterval = setInterval(() => {
        currentStep++;
        const progress = Math.max(0, 100 - (currentStep / totalSteps) * 100);

        const notifications = this.notifications$.value;
        const notif = notifications.find((n) => n.id === notification.id);
        if (notif) {
          notif.progress = progress;
          this.notifications$.next([...notifications]);
        }

        if (currentStep >= totalSteps) {
          clearInterval(progressInterval);
        }
      }, updateInterval);
    }

    // Otomatik kapatma
    setTimeout(() => {
      this.close(notification.id);
    }, duration);
  }

  /**
   * Benzersiz ID üretir
   */
  private generateId(): string {
    return `notification-${++this.notificationIdCounter}-${Date.now()}`;
  }

  /**
   * ProblemDetails formatında mı kontrol eder
   */
  private isProblemDetails(obj: any): obj is ProblemDetails {
    return (
      obj &&
      (obj.type !== undefined ||
        obj.title !== undefined ||
        obj.status !== undefined ||
        obj.detail !== undefined ||
        obj.errors !== undefined)
    );
  }

  /**
   * API Response formatında mı kontrol eder
   */
  private isApiResponse(obj: any): obj is Response {
    return (
      obj && obj.statusCode !== undefined && obj.timestampUtc !== undefined
    );
  }
}
