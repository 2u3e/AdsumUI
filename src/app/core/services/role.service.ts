import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { BaseHttpService } from "./base-http.service";
import { Response } from "../models/api.models";
import {
  RoleResponse,
  RoleListItem,
  GetRolesRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleSelectItem,
} from "../models/role.models";

/**
 * Role Service
 * Rol verilerini yönetmek için API servisi
 */
@Injectable({
  providedIn: "root",
})
export class RoleService extends BaseHttpService {
  private readonly endpoint = "Roles";

  /**
   * Tüm rol kayıtlarını sayfalı olarak getirir
   * GET /Roles/all
   */
  getAllPaged(
    request: GetRolesRequest = {},
  ): Observable<Response<RoleListItem[]>> {
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

    if (request.isSystem !== undefined) {
      params.isSystem = request.isSystem;
    }

    return this.get<RoleListItem[]>(`${this.endpoint}/all`, { params });
  }

  /**
   * Tüm rolleri select box için basitleştirilmiş formatta getirir
   * GET /Roles/getallforselect
   */
  getAllForSelect(): Observable<Response<RoleSelectItem[]>> {
    return this.get<RoleSelectItem[]>(`${this.endpoint}/getallforselect`);
  }

  /**
   * ID'ye göre rol kaydı getirir
   * GET /Roles/{id}
   */
  getById(id: string): Observable<Response<RoleResponse>> {
    return this.get<RoleResponse>(`${this.endpoint}/${id}`);
  }

  /**
   * Yeni rol kaydı oluşturur
   * POST /Roles
   * Returns: GuidResponse (UUID string)
   */
  create(request: CreateRoleRequest): Observable<Response<string>> {
    return this.post<string>(`${this.endpoint}`, request);
  }

  /**
   * Rol kaydını günceller
   * PUT /Roles/{id}
   * Returns: GuidResponse (UUID string)
   */
  update(id: string, request: UpdateRoleRequest): Observable<Response<string>> {
    return this.put<string>(`${this.endpoint}/${id}`, request);
  }

  /**
   * Rol kaydını siler
   * DELETE /Roles/{id}
   */
  deleteById(id: string): Observable<Response<void>> {
    return super.delete<void>(`${this.endpoint}/${id}`);
  }
}
