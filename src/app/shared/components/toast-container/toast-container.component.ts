import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject, takeUntil } from "rxjs";
import { NotificationService } from "../../../core/services/notification.service";
import {
  Notification,
  NotificationPosition,
  NOTIFICATION_ICONS,
} from "../../../core/models/notification.models";

@Component({
  selector: "app-toast-container",
  imports: [CommonModule],
  templateUrl: "./toast-container.component.html",
  styleUrl: "./toast-container.component.scss",
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  notifications: Notification[] = [];
  NotificationPosition = NotificationPosition;

  ngOnInit(): void {
    this.notificationService
      .getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Pozisyona göre notification'ları filtreler
   */
  getNotificationsByPosition(position: NotificationPosition): Notification[] {
    return this.notifications.filter((n) => n.config.position === position);
  }

  /**
   * Notification'ı kapatır
   */
  closeNotification(id: string): void {
    this.notificationService.close(id);
  }

  /**
   * Notification tıklandığında
   */
  onNotificationClick(notification: Notification): void {
    if (notification.config.closeOnClick) {
      this.closeNotification(notification.id);
    }
  }

  /**
   * Icon class'ını döner
   */
  getIconClass(notification: Notification): string {
    return `ki-outline ki-${NOTIFICATION_ICONS[notification.type]}`;
  }

  /**
   * Pozisyon container class'ını döner
   */
  getPositionClass(position: NotificationPosition): string {
    const baseClass = "toast-position";
    switch (position) {
      case NotificationPosition.TopRight:
        return `${baseClass} top-4 right-4`;
      case NotificationPosition.TopLeft:
        return `${baseClass} top-4 left-4`;
      case NotificationPosition.TopCenter:
        return `${baseClass} top-4 left-1/2 -translate-x-1/2`;
      case NotificationPosition.BottomRight:
        return `${baseClass} bottom-4 right-4`;
      case NotificationPosition.BottomLeft:
        return `${baseClass} bottom-4 left-4`;
      case NotificationPosition.BottomCenter:
        return `${baseClass} bottom-4 left-1/2 -translate-x-1/2`;
      default:
        return `${baseClass} top-4 right-4`;
    }
  }

  /**
   * Notification animasyon class'ını döner
   */
  getAnimationClass(notification: Notification): string {
    const animation = notification.config.animation;
    const visible = notification.visible;

    return `toast-animation-${animation} ${visible ? "toast-enter" : "toast-exit"}`;
  }

  /**
   * Alert type class'ını döner (Metronic alert sınıfları)
   */
  getAlertTypeClass(notification: Notification): string {
    const typeMap: Record<string, string> = {
      success: "kt-alert-success",
      error: "kt-alert-destructive",
      warning: "kt-alert-warning",
      info: "kt-alert-info",
      primary: "kt-alert-primary",
    };

    return typeMap[notification.type] || "kt-alert-primary";
  }

  /**
   * Progress bar stilini döner
   */
  getProgressStyle(notification: Notification): any {
    if (
      !notification.config.showProgressBar ||
      notification.progress === undefined
    ) {
      return { width: "0%" };
    }

    return {
      width: `${notification.progress}%`,
    };
  }

  /**
   * Tüm pozisyonları döner
   */
  get positions(): NotificationPosition[] {
    return Object.values(NotificationPosition);
  }
}
