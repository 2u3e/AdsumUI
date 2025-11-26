import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

// Request/Response interfaces
export interface CreateEmployeeWithUserCommand {
  username: string;
  email: string;
  password: string;
  name: string;
  lastName: string;
  workPhone?: string | null;
  mobilePhone?: string | null;
  profileImageId?: string | null;
  profileImageDescription?: string | null;
  identityNumber: string;
  birthDate?: Date | null;
  birthPlace?: string | null;
  registrationNumber?: string | null;
  organizationId: string;
  dutyId: number;
  titleId?: number | null;
  startDate: Date;
  workEmail?: string | null;
  personalEmail?: string | null;
  roles: UserRoleDto[];
  education?: EducationDto[] | null;
  isActive: boolean;
}

export interface UserRoleDto {
  organizationId: string;
  roleId: string;
}

export interface EducationDto {
  educationTypeId?: number | null;
  universityId?: number | null;
  departmentId?: number | null;
  startDate: Date;
  endDate?: Date | null;
}

export interface CreateEmployeeWithUserResponse {
  userId: string;
  citizenId: string;
  employeeId: string;
  fullName: string;
  email: string;
}

export interface UpdateEmployeeWithUserCommand {
  employeeId: string;
  userId: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  lastName?: string | null;
  workPhone?: string | null;
  mobilePhone?: string | null;
  profileImageId?: string | null;
  profileImageDescription?: string | null;
  birthDate?: Date | null;
  birthPlace?: string | null;
  registrationNumber?: string | null;
  organizationId?: string | null;
  dutyId?: number | null;
  titleId?: number | null;
  workEmail?: string | null;
  personalEmail?: string | null;
  roles?: UserRoleDto[] | null;
  education?: EducationDto[] | null;
  isActive?: boolean | null;
}

export interface UpdateEmployeeWithUserResponse {
  userId: string;
  citizenId: string;
  employeeId: string;
  fullName: string;
  email: string;
}

export interface GetAllEmployeesParams {
  pageNumber?: number;
  pageSize?: number;
  organizationId?: string;
  fullName?: string;
  userName?: string;
  email?: string;
  isActive?: boolean;
}

export interface EmployeeListItem {
  id: string;
  fullName: string;
  organizationName: string | null;
  isActive: boolean;
  userName: string | null;
  email: string | null;
  title: string | null;
  duty: string | null;
}

export interface UserRoleInfo {
  roleId: string;
  roleName?: string | null;
  organizationId: string;
  organizationName?: string | null;
}

export interface EducationInfo {
  id: string;
  educationTypeId: number;
  educationTypeName?: string | null;
  universityId?: number | null;
  universityName?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  startDate: string;
  endDate?: string | null;
}

export interface EmployeeDetailResponse {
  employeeId: string;
  registrationNumber?: string | null;
  name: string;
  lastName: string;
  isActive: boolean;
  userId: string;
  username: string;
  email: string;
  workPhone?: string | null;
  mobilePhone?: string | null;
  citizenId: string;
  identityNumber?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  organizationId: string;
  organizationName?: string | null;
  dutyId: number;
  dutyName?: string | null;
  titleId?: number | null;
  titleName?: string | null;
  startDate: string;
  profileImageId?: string | null;
  profileImageDescription?: string | null;
  workEmail?: string | null;
  personalEmail?: string | null;
  roles?: UserRoleInfo[] | null;
  education?: EducationInfo[] | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  message?: string | null;
  data: T;
  errors?: any[] | null;
  pagination?: PaginationMeta;
  correlationId?: string | null;
  timestampUtc: Date;
}

@Injectable({
  providedIn: "root",
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/Employees`;

  constructor(private http: HttpClient) {}

  getAllEmployeesPaged(
    params: GetAllEmployeesParams,
  ): Observable<ApiResponse<EmployeeListItem[]>> {
    const queryParams: any = {};

    if (params.pageNumber) queryParams.pageNumber = params.pageNumber;
    if (params.pageSize) queryParams.pageSize = params.pageSize;
    if (params.organizationId)
      queryParams.organizationId = params.organizationId;
    if (params.fullName) queryParams.fullName = params.fullName;
    if (params.userName) queryParams.userName = params.userName;
    if (params.email) queryParams.email = params.email;
    if (params.isActive !== undefined) queryParams.isActive = params.isActive;

    return this.http.get<ApiResponse<EmployeeListItem[]>>(this.apiUrl, {
      params: queryParams,
    });
  }

  createEmployeeWithUser(
    command: CreateEmployeeWithUserCommand,
  ): Observable<ApiResponse<CreateEmployeeWithUserResponse>> {
    return this.http.post<ApiResponse<CreateEmployeeWithUserResponse>>(
      `${this.apiUrl}/with-user`,
      command,
    );
  }

  updateEmployeeWithUser(
    employeeId: string,
    command: UpdateEmployeeWithUserCommand,
  ): Observable<ApiResponse<UpdateEmployeeWithUserResponse>> {
    return this.http.put<ApiResponse<UpdateEmployeeWithUserResponse>>(
      `${this.apiUrl}/${employeeId}/with-user`,
      command,
    );
  }

  getEmployeeById(
    employeeId: string,
  ): Observable<ApiResponse<EmployeeDetailResponse>> {
    return this.http.get<ApiResponse<EmployeeDetailResponse>>(
      `${this.apiUrl}/${employeeId}`,
    );
  }

  updateEmployeeStatus(
    employeeId: string,
    isActive: boolean,
  ): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.apiUrl}/${employeeId}/status`,
      { isActive },
    );
  }
}
