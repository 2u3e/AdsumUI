import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Response interfaces
export interface OrganizationSelectResponse {
  id: string;
  name: string;
}

export interface OrganizationPagedResponse {
  id: string;
  name: string;
  parentName?: string | null;
  typeName?: string | null;
  shortName?: string | null;
  isActive: boolean;
  description?: string | null;
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
export class OrganizationService {
  private apiUrl = `${environment.apiUrl}/Organizations`;

  constructor(private http: HttpClient) {}

  getAllOrganizations(
    pageNumber: number = 1,
    pageSize: number = 10,
    parentId?: string,
    organizationId?: string,
    name?: string,
    shortName?: string,
    typeId?: number
  ): Observable<ApiResponse<OrganizationPagedResponse[]>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (parentId) params = params.set('parentId', parentId);
    if (organizationId) params = params.set('organizationId', organizationId);
    if (name) params = params.set('name', name);
    if (shortName) params = params.set('shortName', shortName);
    if (typeId) params = params.set('typeId', typeId.toString());

    return this.http.get<ApiResponse<OrganizationPagedResponse[]>>(
      `${this.apiUrl}/all`,
      { params }
    );
  }

  getAllOrganizationsForSelect(): Observable<ApiResponse<OrganizationSelectResponse[]>> {
    return this.http.get<ApiResponse<OrganizationSelectResponse[]>>(
      `${this.apiUrl}/getallforselect`
    );
  }

  getOrganizationById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
