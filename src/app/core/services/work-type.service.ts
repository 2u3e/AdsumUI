import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { BaseHttpService } from "./base-http.service";
import { Response } from "../models/api.models";
import {
  WorkTypeItem,
  WorkTypeListItem,
  GetWorkTypesRequest,
  CreateWorkTypeRequest,
  UpdateWorkTypeRequest,
} from "../models/work-type.models";

/**
 * WorkType Service
 * İş tipi verilerini yönetmek için API servisi
 */
@Injectable({
  providedIn: "root",
})
export class WorkTypeService extends BaseHttpService {
  private readonly endpoint = "WorkType";

  /**
   * Tüm work type kayıtlarını sayfalı olarak getirir
   * GET /WorkType
   */
  getAllPaged(
    request: GetWorkTypesRequest = {},
  ): Observable<Response<WorkTypeListItem[]>> {
    const params: any = {};

    if (request.pageNumber !== undefined) {
      params.pageNumber = request.pageNumber;
    }

    if (request.pageSize !== undefined) {
      params.pageSize = request.pageSize;
    }

    if (request.name) {
      params.name = request.name;
    }

    if (request.groupId) {
      params.groupId = request.groupId;
    }

    if (request.isActive !== undefined) {
      params.isActive = request.isActive;
    }

    if (request.isCreatable !== undefined) {
      params.isCreatable = request.isCreatable;
    }

    return this.get<WorkTypeListItem[]>(`${this.endpoint}`, {
      params,
    });
  }

  /**
   * ID'ye göre work type kaydı getirir
   * GET /WorkType/{workTypeId}
   */
  getById(workTypeId: string): Observable<Response<WorkTypeItem>> {
    return this.get<WorkTypeItem>(`${this.endpoint}/${workTypeId}`);
  }

  /**
   * Yeni work type kaydı oluşturur
   * POST /WorkType
   * Returns: GuidResponse (UUID string)
   */
  create(request: CreateWorkTypeRequest): Observable<Response<string>> {
    return this.post<string>(`${this.endpoint}`, request);
  }

  /**
   * Work type kaydını günceller
   * PUT /WorkType/{workTypeId}
   * Returns: Response
   */
  update(
    workTypeId: string,
    request: UpdateWorkTypeRequest,
  ): Observable<Response<void>> {
    return this.put<void>(`${this.endpoint}/${workTypeId}`, request);
  }

  /**
   * Work type kaydını siler
   * DELETE /WorkType/{workTypeId}
   */
  deleteById(workTypeId: string): Observable<Response<void>> {
    return super.delete<void>(`${this.endpoint}/${workTypeId}`);
  }
}
