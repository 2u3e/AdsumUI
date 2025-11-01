import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { BaseHttpService } from "./base-http.service";
import { Response } from "../models/api.models";
import {
  LookupItem,
  GetLookupsRequest,
  CreateLookupRequest,
  UpdateLookupRequest,
} from "../models/lookup.models";

/**
 * Lookup Service
 * Lookup verilerini yönetmek için API servisi
 */
@Injectable({
  providedIn: "root",
})
export class LookupService extends BaseHttpService {
  private readonly endpoint = "lookup";

  /**
   * Tüm lookup kayıtlarını sayfalı olarak getirir
   */
  getAllPaged(
    request: GetLookupsRequest = {},
  ): Observable<Response<LookupItem[]>> {
    const params: any = {};

    if (request.pageNumber !== undefined) {
      params.pageNumber = request.pageNumber;
    }

    if (request.pageSize !== undefined) {
      params.pageSize = request.pageSize;
    }

    if (request.searchTerm) {
      params.searchTerm = request.searchTerm;
    }

    return this.get<LookupItem[]>(`${this.endpoint}/all`, { params });
  }

  /**
   * ID'ye göre lookup kaydı getirir
   */
  getById(id: number): Observable<Response<LookupItem>> {
    return this.get<LookupItem>(`${this.endpoint}/${id}`);
  }

  /**
   * Yeni lookup kaydı oluşturur
   */
  create(request: CreateLookupRequest): Observable<Response<LookupItem>> {
    return this.post<LookupItem>(this.endpoint, request);
  }

  /**
   * Lookup kaydını günceller
   */
  update(request: UpdateLookupRequest): Observable<Response<LookupItem>> {
    return this.put<LookupItem>(`${this.endpoint}/${request.id}`, request);
  }

  /**
   * Lookup kaydını siler
   */
  deleteById(id: number): Observable<Response<void>> {
    return super.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Lookup kaydının aktif/pasif durumunu değiştirir
   */
  toggleActive(id: number): Observable<Response<LookupItem>> {
    return this.patch<LookupItem>(`${this.endpoint}/${id}/toggle-active`, {});
  }
}
