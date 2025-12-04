import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { BaseHttpService } from "./base-http.service";
import { Response } from "../models/api.models";
import {
  CitizenItem,
  CitizenListItem,
  CitizenSelectItem,
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
   * Tüm citizen kayıtlarını sayfalı olarak getirir
   * GET /Citizens/all
   */
  getAllPaged(
    request: GetCitizensRequest = {},
  ): Observable<Response<CitizenListItem[]>> {
    const params: any = {};

    if (request.pageNumber !== undefined) {
      params.pageNumber = request.pageNumber;
    }

    if (request.pageSize !== undefined) {
      params.pageSize = request.pageSize;
    }

    if (request.identityNumber) {
      params.identityNumber = request.identityNumber;
    }

    if (request.name) {
      params.name = request.name;
    }

    if (request.lastName) {
      params.lastName = request.lastName;
    }

    if (request.isActive !== undefined) {
      params.isActive = request.isActive;
    }

    return this.get<CitizenListItem[]>(`${this.endpoint}/all`, {
      params,
    });
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
   * Returns: CitizenResponse
   */
  update(
    id: string,
    request: UpdateCitizenRequest,
  ): Observable<Response<CitizenItem>> {
    return this.put<CitizenItem>(`${this.endpoint}/${id}`, request);
  }

  /**
   * Citizen kaydını siler
   * DELETE /Citizens/{id}
   */
  deleteById(id: string): Observable<Response<void>> {
    return super.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Select box için citizen listesini getirir
   * GET /Citizens/GetAllForSelect
   */
  getAllForSelect(): Observable<Response<CitizenSelectItem[]>> {
    return this.get<CitizenSelectItem[]>(`${this.endpoint}/GetAllForSelect`);
  }
}
