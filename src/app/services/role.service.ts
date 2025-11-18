import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Response interfaces
export interface RoleSelectResponse {
  id: string;
  name: string;
}

export interface RolePagedResponse {
  id: string;
  name: string;
  isSystem: boolean;
}

export interface ApiResponse<T> {
  statusCode: number;
  message?: string | null;
  data: T;
  errors?: any[] | null;
  pagination?: any;
  correlationId?: string | null;
  timestampUtc: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/Roles`;

  constructor(private http: HttpClient) {}

  getAllRoles(
    pageNumber: number = 1,
    pageSize: number = 10,
    name?: string,
    isSystem?: boolean
  ): Observable<ApiResponse<RolePagedResponse[]>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (name) params = params.set('name', name);
    if (isSystem !== undefined) params = params.set('isSystem', isSystem.toString());

    return this.http.get<ApiResponse<RolePagedResponse[]>>(
      `${this.apiUrl}/all`,
      { params }
    );
  }

  getAllRolesForSelect(): Observable<ApiResponse<RoleSelectResponse[]>> {
    return this.http.get<ApiResponse<RoleSelectResponse[]>>(
      `${this.apiUrl}/getallforselect`
    );
  }

  getRoleById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
