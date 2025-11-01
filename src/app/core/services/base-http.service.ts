import { Injectable, inject } from "@angular/core";
import {
  HttpClient,
  HttpParams,
  HttpHeaders,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";

import { environment } from "../../../environments/environment";
import { Response, ApiRequestOptions, extractData } from "../models/api.models";

/**
 * Base HTTP Service
 * Tüm API istekleri için merkezi HTTP servisi
 */
@Injectable({
  providedIn: "root",
})
export class BaseHttpService {
  private http = inject(HttpClient);
  protected apiUrl = environment.apiUrl;

  /**
   * GET isteği
   */
  protected get<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Observable<Response<T>> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);

    return this.http
      .get<Response<T>>(url, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * GET isteği - Sadece data döner
   */
  protected getData<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.get<T>(endpoint, options).pipe(
      map((response) => extractData(response)),
    );
  }

  /**
   * POST isteği
   */
  protected post<T>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions,
  ): Observable<Response<T>> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);

    return this.http
      .post<Response<T>>(url, body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * POST isteği - Sadece data döner
   */
  protected postData<T>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.post<T>(endpoint, body, options).pipe(
      map((response) => extractData(response)),
    );
  }

  /**
   * PUT isteği
   */
  protected put<T>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions,
  ): Observable<Response<T>> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);

    return this.http
      .put<Response<T>>(url, body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT isteği - Sadece data döner
   */
  protected putData<T>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.put<T>(endpoint, body, options).pipe(
      map((response) => extractData(response)),
    );
  }

  /**
   * DELETE isteği
   */
  protected delete<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Observable<Response<T>> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);

    return this.http
      .delete<Response<T>>(url, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * DELETE isteği - Sadece data döner
   */
  protected deleteData<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.delete<T>(endpoint, options).pipe(
      map((response) => extractData(response)),
    );
  }

  /**
   * PATCH isteği
   */
  protected patch<T>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions,
  ): Observable<Response<T>> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);

    return this.http
      .patch<Response<T>>(url, body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * PATCH isteği - Sadece data döner
   */
  protected patchData<T>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.patch<T>(endpoint, body, options).pipe(
      map((response) => extractData(response)),
    );
  }

  /**
   * URL oluşturur
   */
  private buildUrl(endpoint: string): string {
    // Endpoint / ile başlıyorsa kaldır
    const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint.substring(1)
      : endpoint;

    // API URL / ile bitiyorsa kaldır
    const cleanApiUrl = this.apiUrl.endsWith("/")
      ? this.apiUrl.substring(0, this.apiUrl.length - 1)
      : this.apiUrl;

    return `${cleanApiUrl}/${cleanEndpoint}`;
  }

  /**
   * HTTP options oluşturur
   */
  private buildHttpOptions(options?: ApiRequestOptions): {
    params: HttpParams;
    headers: HttpHeaders;
    observe: "body";
  } {
    let httpParams = new HttpParams();
    let httpHeaders = new HttpHeaders();

    // Query parametrelerini ekle
    if (options?.params) {
      Object.keys(options.params).forEach((key) => {
        const value = options.params![key];
        if (value !== undefined && value !== null && value !== "") {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    // Header'ları ekle
    if (options?.headers) {
      Object.keys(options.headers).forEach((key) => {
        httpHeaders = httpHeaders.set(key, options.headers![key]);
      });
    }

    return {
      params: httpParams,
      headers: httpHeaders,
      observe: "body",
    };
  }

  /**
   * HTTP hatalarını işler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = "Bilinmeyen bir hata oluştu";

    if (error.error instanceof ErrorEvent) {
      // Client-side veya network hatası
      errorMessage = `Hata: ${error.error.message}`;
    } else {
      // Backend hatası
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors && Array.isArray(error.error.errors)) {
        errorMessage = error.error.errors.map((e: any) => e.message).join(", ");
      } else if (error.status === 0) {
        errorMessage =
          "Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.";
      } else if (error.status === 401) {
        errorMessage = "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
      } else if (error.status === 403) {
        errorMessage = "Bu işlem için yetkiniz bulunmuyor.";
      } else if (error.status === 404) {
        errorMessage = "İstenen kaynak bulunamadı.";
      } else if (error.status >= 500) {
        errorMessage =
          "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.";
      } else {
        errorMessage = `Hata kodu: ${error.status} - ${error.message}`;
      }
    }

    console.error("HTTP Error:", error);
    return throwError(() => new Error(errorMessage));
  }
}
