import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { BaseHttpService } from "./base-http.service";
import { Response } from "../models/api.models";
import { GetMenuTreeWithPermissionsResponse } from "../models/menu-permission.models";

@Injectable({
  providedIn: "root",
})
export class MenuPermissionService extends BaseHttpService {
  private readonly endpoint = "MenuPermissions";

  getMenuTree(): Observable<Response<GetMenuTreeWithPermissionsResponse[]>> {
    return this.get<GetMenuTreeWithPermissionsResponse[]>(
      `${this.endpoint}/menu-tree`,
    );
  }
}
