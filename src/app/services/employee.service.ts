import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/Employees`;

  constructor(private http: HttpClient) {}

  createEmployeeWithUser(command: CreateEmployeeWithUserCommand): Observable<ApiResponse<CreateEmployeeWithUserResponse>> {
    return this.http.post<ApiResponse<CreateEmployeeWithUserResponse>>(
      `${this.apiUrl}/with-user`,
      command
    );
  }

  updateEmployeeWithUser(employeeId: string, command: UpdateEmployeeWithUserCommand): Observable<ApiResponse<UpdateEmployeeWithUserResponse>> {
    return this.http.put<ApiResponse<UpdateEmployeeWithUserResponse>>(
      `${this.apiUrl}/${employeeId}/with-user`,
      command
    );
  }
}
