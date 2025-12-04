import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

// Response interfaces
export interface ReferenceDataResponse {
  id: number;
  name: string;
  shortName?: string | null;
  order?: number | null;
  isActive: boolean;
}

export interface SelectItemResponse {
  id: number;
  name: string;
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

// Reference Types - Backend ReferenceTypes enum değerleri
export enum ReferenceTypes {
  AddressType = 100, // Adres Tipi
  CommunicationOwnerType = 101, // İletişim Sahibi Tipi
  EmployeeDutyType = 102, // Çalışan Görev Tipi
  EmployeePassivityReasonType = 103, // Çalışan Pasiflik Nedeni Tipi
  EmployeeTitleType = 104, // Çalışan Ünvan Tipi
  WorkGroup = 105, // İş Grubu
  OrganizationType = 106, // Organizasyon Tipi
  PhoneNumberType = 107, // Telefon Numarası Tipi
  EducationType = 108, // Eğitim Tipi
  University = 109, // Üniversite
  UniversityDepartment = 110, // Üniversite Bölümü
  MaritalStatusType = 111, // Medeni Durum Tipi
  BloodType = 112, // Kan Grubu
  NationalityType = 113, // Uyruk Tipi
  MenuType = 114, // Menü Tipi
  PermissionType = 115, // İzin Tipi
}

@Injectable({
  providedIn: "root",
})
export class ReferenceService {
  private apiUrl = `${environment.apiUrl}/referencedata`;

  constructor(private http: HttpClient) {}

  getReferenceDataByReferenceId(
    referenceId: number,
    onlyActive: boolean = true,
  ): Observable<ApiResponse<ReferenceDataResponse[]>> {
    const params = new HttpParams().set("onlyActive", onlyActive.toString());
    return this.http.get<ApiResponse<ReferenceDataResponse[]>>(
      `${this.apiUrl}/by-reference/${referenceId}`,
      { params },
    );
  }

  getSelectItemsByReferenceId(
    referenceId: number,
    isShortName: boolean = false,
  ): Observable<ApiResponse<SelectItemResponse[]>> {
    const params = new HttpParams().set("isShortName", isShortName.toString());
    return this.http.get<ApiResponse<SelectItemResponse[]>>(
      `${this.apiUrl}/select/${referenceId}`,
      { params },
    );
  }

  // Convenience methods for specific reference data
  getOrganizationTypes(): Observable<ApiResponse<SelectItemResponse[]>> {
    return this.getSelectItemsByReferenceId(ReferenceTypes.OrganizationType);
  }

  getEmployeeDutyTypes(): Observable<ApiResponse<SelectItemResponse[]>> {
    return this.getSelectItemsByReferenceId(ReferenceTypes.EmployeeDutyType);
  }

  getEmployeeTitleTypes(): Observable<ApiResponse<SelectItemResponse[]>> {
    return this.getSelectItemsByReferenceId(ReferenceTypes.EmployeeTitleType);
  }

  getEducationTypes(): Observable<ApiResponse<SelectItemResponse[]>> {
    return this.getSelectItemsByReferenceId(ReferenceTypes.EducationType);
  }

  getUniversities(): Observable<ApiResponse<SelectItemResponse[]>> {
    return this.getSelectItemsByReferenceId(ReferenceTypes.University);
  }

  getUniversityDepartments(): Observable<ApiResponse<SelectItemResponse[]>> {
    return this.getSelectItemsByReferenceId(
      ReferenceTypes.UniversityDepartment,
    );
  }

  // Additional reference methods
  getPhoneNumberTypes(): Observable<ApiResponse<SelectItemResponse[]>> {
    return this.getSelectItemsByReferenceId(ReferenceTypes.PhoneNumberType);
  }

  getMaritalStatusTypes(): Observable<ApiResponse<SelectItemResponse[]>> {
    return this.getSelectItemsByReferenceId(ReferenceTypes.MaritalStatusType);
  }

  getBloodTypes(): Observable<ApiResponse<SelectItemResponse[]>> {
    return this.getSelectItemsByReferenceId(ReferenceTypes.BloodType);
  }

  getNationalityTypes(): Observable<ApiResponse<SelectItemResponse[]>> {
    return this.getSelectItemsByReferenceId(ReferenceTypes.NationalityType);
  }
}
