import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { BaseHttpService } from "./base-http.service";
import { Response } from "../models/api.models";
import {
  CitizenItem,
  CitizenListItem,
  GetCitizensRequest,
  CreateCitizenRequest,
  UpdateCitizenRequest,
} from "../models/citizen.models";

/**
 * Citizen Service
 * Vatandaş verilerini yönetmek için API servisi
 */
@Injectable({
  providedIn: "root",
})
export class CitizenService extends BaseHttpService {
  private readonly endpoint = "Citizens";

  /**
   * Tüm citizen kayıtlarını getirir
   * GET /Citizens
   */
  getAll(
    request: GetCitizensRequest = {},
  ): Observable<Response<CitizenListItem[]>> {
    const params: any = {};

    if (request.onlyActive !== undefined) {
      params.onlyActive = request.onlyActive;
    }

    return this.get<CitizenListItem[]>(`${this.endpoint}`, { params });
  }

  /**
   * ID'ye göre citizen kaydı getirir
   * GET /Citizens/{id}
   */
  getById(id: string): Observable<Response<CitizenItem>> {
    return this.get<CitizenItem>(`${this.endpoint}/${id}`);
  }

  /**
   * TC Kimlik Numarasına göre citizen kaydı getirir
   * GET /Citizens/by-identity/{identityNumber}
   */
  getByIdentityNumber(
    identityNumber: string,
  ): Observable<Response<CitizenItem>> {
    return this.get<CitizenItem>(
      `${this.endpoint}/by-identity/${identityNumber}`,
    );
  }

  /**
   * Yeni citizen kaydı oluşturur
   * POST /Citizens
   * Returns: GuidResponse (UUID string)
   */
  create(request: CreateCitizenRequest): Observable<Response<string>> {
    return this.post<string>(`${this.endpoint}`, request);
  }

  /**
   * Citizen kaydını günceller
   * PUT /Citizens/{id}
   * Returns: GuidResponse (UUID string)
   */
  update(
    id: string,
    request: UpdateCitizenRequest,
  ): Observable<Response<string>> {
    return this.put<string>(`${this.endpoint}/${id}`, request);
  }

  /**
   * Citizen kaydını siler
   * DELETE /Citizens/{id}
   */
  deleteById(id: string): Observable<Response<void>> {
    return super.delete<void>(`${this.endpoint}/${id}`);
  }
}
