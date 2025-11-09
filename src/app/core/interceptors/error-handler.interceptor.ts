import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { Response } from '../models/api.models';

/**
 * Error Handler Interceptor
 * HTTP isteklerinde oluşan hataları yakalar ve otomatik notification gösterir
 */
export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  // Otomatik bildirim gösterilmemesi gereken URL'ler
  const skipNotificationUrls = [
    '/connect/token',
    '/auth/login',
    '/auth/refresh',
  ];

  const shouldSkipNotification = skipNotificationUrls.some((url) =>
    req.url.includes(url)
  );

  // Query parametresinde silent=true varsa bildirim gösterme
  const isSilent = req.params.has('silent') && req.params.get('silent') === 'true';

  // Header'da X-Skip-Notification varsa bildirim gösterme
  const skipNotificationHeader = req.headers.has('X-Skip-Notification');

  const shouldShowNotification =
    !shouldSkipNotification && !isSilent && !skipNotificationHeader;

  return next(req).pipe(
    // Başarılı response'ları kontrol et
    tap((event) => {
      if (event instanceof HttpResponse) {
        // Response body'si Response<T> formatında mı?
        const body = event.body;
        if (body && isApiResponse(body)) {
          handleSuccessResponse(body, shouldShowNotification, notificationService);
        }
      }
    }),
    // Hataları yakala
    catchError((error: HttpErrorResponse) => {
      if (shouldShowNotification) {
        notificationService.fromHttpError(error);
      }

      // Hatayı console'a da logla
      console.error('HTTP Error:', {
        url: req.url,
        method: req.method,
        status: error.status,
        error: error.error,
        message: error.message,
      });

      return throwError(() => error);
    })
  );
};

/**
 * Başarılı response'ları işle
 */
function handleSuccessResponse(
  response: Response<any>,
  shouldShowNotification: boolean,
  notificationService: NotificationService
): void {
  // Hata içeren başarılı response'lar (validation errors vs.)
  if (response.errors && response.errors.length > 0) {
    if (shouldShowNotification) {
      notificationService.fromErrorDetails(response.errors);
    }
    return;
  }

  // Başarılı mesaj varsa göster (opsiyonel)
  // Not: Her başarılı işlemde notification göstermek istemeyebiliriz
  // Bu yüzden sadece explicit olarak mesaj verilmişse gösteriyoruz
  if (response.message && shouldShowNotification) {
    // Sadece POST, PUT, PATCH, DELETE işlemlerinde başarı mesajı göster
    // GET işlemlerinde genellikle göstermek istemeyiz
    const method = (response as any)._method; // Bu bilgiyi custom olarak ekleyebiliriz
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      notificationService.success(response.message);
    }
  }
}

/**
 * API Response formatında mı kontrol et
 */
function isApiResponse(obj: any): obj is Response {
  return (
    obj &&
    typeof obj === 'object' &&
    'statusCode' in obj &&
    'timestampUtc' in obj
  );
}
