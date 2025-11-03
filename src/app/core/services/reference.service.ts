import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { BaseHttpService } from "./base-http.service";
import { Response } from "../models/api.models";
import {
  ReferenceItem,
  GetReferencesRequest,
  CreateReferenceRequest,
  UpdateReferenceRequest,
  ReferenceDataItem,
  GetReferenceDataRequest,
  CreateReferenceDataRequest,
  UpdateReferenceDataRequest,
  ReferenceDataSelectItem,
} from "../models/reference.models";

/**
 * Reference Service
 * Reference verilerini yönetmek için API servisi
 */
@Injectable({
  providedIn: "root",
})
export class ReferenceService extends BaseHttpService {
  private readonly endpoint = "reference";
  private readonly dataEndpoint = "referencedata";

  // ============================================
  // REFERENCE ENDPOINTS (eski LookUp)
  // ============================================

  /**
   * Tüm reference kayıtlarını sayfalı olarak getirir
   * GET /reference/all
   */
  getAllPaged(
    request: GetReferencesRequest = {},
  ): Observable<Response<ReferenceItem[]>> {
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

    return this.get<ReferenceItem[]>(`${this.endpoint}/all`, { params });
  }

  /**
   * ID'ye göre reference kaydı getirir
   * GET /reference/{id}
   */
  getById(id: string): Observable<Response<ReferenceItem>> {
    return this.get<ReferenceItem>(`${this.endpoint}/${id}`);
  }

  /**
   * Yeni reference kaydı oluşturur
   * POST /reference/create
   */
  create(request: CreateReferenceRequest): Observable<Response<string>> {
    return this.post<string>(`${this.endpoint}/create`, request);
  }

  /**
   * Reference kaydını günceller
   * PUT /reference/{id}
   */
  update(request: UpdateReferenceRequest): Observable<Response<string>> {
    return this.put<string>(`${this.endpoint}/${request.id}`, request);
  }

  /**
   * Reference kaydını siler
   * DELETE /reference/{id}
   */
  deleteById(id: string): Observable<Response<void>> {
    return super.delete<void>(`${this.endpoint}/${id}`);
  }

  // ============================================
  // REFERENCE DATA ENDPOINTS (eski LookUpList)
  // ============================================

  /**
   * Tüm reference data kayıtlarını sayfalı olarak getirir
   * GET /referencedata/all
   */
  getAllDataPaged(
    request: GetReferenceDataRequest = {},
  ): Observable<Response<ReferenceDataItem[]>> {
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

    if (request.referenceBusinessId !== undefined) {
      params.referenceBusinessId = request.referenceBusinessId;
    }

    return this.get<ReferenceDataItem[]>(`${this.dataEndpoint}/all`, {
      params,
    });
  }

  /**
   * ID'ye göre reference data kaydı getirir
   * GET /referencedata/{id}
   */
  getDataById(id: string): Observable<Response<ReferenceDataItem>> {
    return this.get<ReferenceDataItem>(`${this.dataEndpoint}/${id}`);
  }

  /**
   * Reference ID'ye göre reference data listesi getirir
   * GET /referencedata/by-reference/{referenceId}
   */
  getDataByReferenceId(
    referenceBusinessId: number,
    onlyActive: boolean = true,
  ): Observable<Response<ReferenceDataItem[]>> {
    const params: any = { referenceBusinessId, onlyActive };
    return this.get<ReferenceDataItem[]>(
      `${this.dataEndpoint}/by-reference/${referenceBusinessId}`,
      { params },
    );
  }

  /**
   * Select için reference data listesi getirir
   * GET /referencedata/select/{referenceId}
   */
  getDataForSelect(
    referenceBusinessId: number,
    isShortName: boolean = false,
  ): Observable<Response<ReferenceDataSelectItem[]>> {
    const params: any = { referenceBusinessId, isShortName };
    return this.get<ReferenceDataSelectItem[]>(
      `${this.dataEndpoint}/select/${referenceBusinessId}`,
      { params },
    );
  }

  /**
   * Yeni reference data kaydı oluşturur
   * POST /referencedata
   */
  createData(
    request: CreateReferenceDataRequest,
  ): Observable<Response<number>> {
    return this.post<number>(`${this.dataEndpoint}`, request);
  }

  /**
   * Reference data kaydını günceller
   * PUT /referencedata/{id}
   */
  updateData(
    request: UpdateReferenceDataRequest,
  ): Observable<Response<number>> {
    return this.put<number>(`${this.dataEndpoint}/${request.id}`, request);
  }

  /**
   * Reference data kaydını siler
   * DELETE /referencedata/{id}
   */
  deleteDataById(id: string): Observable<Response<void>> {
    return super.delete<void>(`${this.dataEndpoint}/${id}`);
  }
}
