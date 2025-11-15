import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { BaseHttpService } from "./base-http.service";
import { Response } from "../models/api.models";
import {
  MenuResponse,
  MenuListItem,
  MenuSelectItem,
  GetMenusRequest,
  CreateMenuRequest,
  UpdateMenuRequest,
} from "../models/menu.models";

/**
 * Menu Service
 * Menü verilerini yönetmek için API servisi
 */
@Injectable({
  providedIn: "root",
})
export class MenuService extends BaseHttpService {
  private readonly endpoint = "Menus";

  /**
   * Tüm menu kayıtlarını sayfalı olarak getirir
   * GET /Menus
   */
  getAllPaged(
    request: GetMenusRequest = {},
  ): Observable<Response<MenuListItem[]>> {
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

    if (request.code) {
      params.code = request.code;
    }

    if (request.name) {
      params.name = request.name;
    }

    if (request.isActive !== undefined) {
      params.isActive = request.isActive;
    }

    if (request.isVisible !== undefined) {
      params.isVisible = request.isVisible;
    }

    return this.get<MenuListItem[]>(`${this.endpoint}`, { params });
  }

  /**
   * ID'ye göre menu kaydı getirir
   * GET /Menus/{id}
   */
  getById(id: string): Observable<Response<MenuResponse>> {
    return this.get<MenuResponse>(`${this.endpoint}/${id}`);
  }

  /**
   * Yeni menu kaydı oluşturur
   * POST /Menus
   * Returns: GuidResponse (UUID string)
   */
  create(request: CreateMenuRequest): Observable<Response<string>> {
    return this.post<string>(`${this.endpoint}`, request);
  }

  /**
   * Menu kaydını günceller
   * PUT /Menus/{id}
   * Returns: GuidResponse (UUID string)
   */
  update(
    id: string,
    request: UpdateMenuRequest,
  ): Observable<Response<string>> {
    return this.put<string>(`${this.endpoint}/${id}`, request);
  }

  /**
   * Menu kaydını siler
   * DELETE /Menus/{id}
   */
  deleteById(id: string): Observable<Response<void>> {
    return super.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Role göre menüleri getirir
   * GET /Menus/by-role/{roleId}
   */
  getByRoleId(roleId: string): Observable<Response<MenuListItem[]>> {
    return this.get<MenuListItem[]>(`${this.endpoint}/by-role/${roleId}`);
  }
}
