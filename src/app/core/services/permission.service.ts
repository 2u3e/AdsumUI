import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { BaseHttpService } from "./base-http.service";
import { Response } from "../models/api.models";
import {
  PermissionListItem,
  GetPermissionsRequest,
} from "../models/permission.models";

/**
 * Permission Service
 * Permission verilerini yönetmek için API servisi
 */
@Injectable({
  providedIn: "root",
})
export class PermissionService extends BaseHttpService {
  private readonly endpoint = "Menus/permissions";

  /**
   * Tüm permission kayıtlarını sayfalı olarak getirir
   * GET /Menus/permissions
   */
  getAllPaged(
    request: GetPermissionsRequest = {},
  ): Observable<Response<PermissionListItem[]>> {
    const params: any = {};

    if (request.pageNumber !== undefined) {
      params.pageNumber = request.pageNumber;
    }

    if (request.pageSize !== undefined) {
      params.pageSize = request.pageSize;
    }

    if (request.isActive !== undefined) {
      params.isActive = request.isActive;
    }

    return this.get<PermissionListItem[]>(`${this.endpoint}`, { params });
  }
}
