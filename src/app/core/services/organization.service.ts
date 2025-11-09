import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { BaseHttpService } from "./base-http.service";
import { Response } from "../models/api.models";
import {
  OrganizationItem,
  OrganizationListItem,
  OrganizationSelectItem,
  GetOrganizationsRequest,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from "../models/organization.models";

/**
 * Organization Service
 * Organizasyon verilerini yönetmek için API servisi
 */
@Injectable({
  providedIn: "root",
})
export class OrganizationService extends BaseHttpService {
  private readonly endpoint = "Organizations";

  /**
   * Tüm organization kayıtlarını sayfalı olarak getirir
   * GET /Organizations/all
   */
  getAllPaged(
    request: GetOrganizationsRequest = {},
  ): Observable<Response<OrganizationListItem[]>> {
    const params: any = {};

    if (request.pageNumber !== undefined) {
      params.pageNumber = request.pageNumber;
    }

    if (request.pageSize !== undefined) {
      params.pageSize = request.pageSize;
    }

    if (request.parentId) {
      params.parentId = request.parentId;
    }

    if (request.organizationId) {
      params.organizationId = request.organizationId;
    }

    if (request.name) {
      params.name = request.name;
    }

    if (request.shortName) {
      params.shortName = request.shortName;
    }

    if (request.typeId !== undefined) {
      params.typeId = request.typeId;
    }

    return this.get<OrganizationListItem[]>(`${this.endpoint}/all`, {
      params,
    });
  }

  /**
   * ID'ye göre organization kaydı getirir (hierarşik yapı ile)
   * GET /Organizations/{id}
   */
  getById(id: string): Observable<Response<OrganizationItem>> {
    return this.get<OrganizationItem>(`${this.endpoint}/${id}`);
  }

  /**
   * Yeni organization kaydı oluşturur
   * POST /Organizations
   * Returns: GuidResponse (UUID string)
   */
  create(request: CreateOrganizationRequest): Observable<Response<string>> {
    return this.post<string>(`${this.endpoint}`, request);
  }

  /**
   * Organization kaydını günceller
   * PUT /Organizations/{id}
   * Returns: OrganizationResponse
   */
  update(
    id: string,
    request: UpdateOrganizationRequest,
  ): Observable<Response<OrganizationItem>> {
    return this.put<OrganizationItem>(`${this.endpoint}/${id}`, request);
  }

  /**
   * Organization kaydını siler
   * DELETE /Organizations/{id}
   */
  deleteById(id: string): Observable<Response<void>> {
    return super.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Select box için organization listesini getirir
   * GET /Organizations/GetAllForSelect
   */
  getAllForSelect(): Observable<Response<OrganizationSelectItem[]>> {
    return this.get<OrganizationSelectItem[]>(
      `${this.endpoint}/GetAllForSelect`,
    );
  }
}
