/**
 * Reference Types Enum
 * Backend'deki ReferenceTypes enum'ına karşılık gelir
 */
export enum ReferenceTypes {
  /** Adres Tipi */
  AddressType = 100,

  /** İletişim Sahibi Tipi */
  CommunicationOwnerType = 101,

  /** Çalışan Görev Tipi */
  EmployeeDutyType = 102,

  /** Çalışan Pasiflik Nedeni Tipi */
  EmployeePassivityReasonType = 103,

  /** Çalışan Unvan Tipi */
  EmployeeTitleType = 104,

  /** Cinsiyet Tipi */
  GenderType = 105,

  /** Organizasyon Tipi */
  OrganizationType = 106,

  /** Telefon Numarası Tipi */
  PhoneNumberType = 107,

  /** Eğitim Tipi */
  EducationType = 108,

  /** Üniversite */
  University = 109,

  /** Üniversite Bölümü */
  UniversityDepartment = 110,

  /** Medeni Durum Tipi */
  MaritalStatusType = 111,

  /** Kan Grubu */
  BloodType = 112,

  /** Uyruk Tipi */
  NationalityType = 113,
}

/**
 * Reference Type Display Names
 * Her enum değeri için görüntülenecek isimler
 */
export const ReferenceTypeDisplayNames: Record<ReferenceTypes, string> = {
  [ReferenceTypes.AddressType]: "Adres Tipi",
  [ReferenceTypes.CommunicationOwnerType]: "İletişim Sahibi Tipi",
  [ReferenceTypes.EmployeeDutyType]: "Çalışan Görev Tipi",
  [ReferenceTypes.EmployeePassivityReasonType]: "Çalışan Pasiflik Nedeni Tipi",
  [ReferenceTypes.EmployeeTitleType]: "Çalışan Unvan Tipi",
  [ReferenceTypes.GenderType]: "Cinsiyet Tipi",
  [ReferenceTypes.OrganizationType]: "Birim Tipi",
  [ReferenceTypes.PhoneNumberType]: "Telefon Numarası Tipi",
  [ReferenceTypes.EducationType]: "Eğitim Tipi",
  [ReferenceTypes.University]: "Üniversite",
  [ReferenceTypes.UniversityDepartment]: "Üniversite Bölümü",
  [ReferenceTypes.MaritalStatusType]: "Medeni Durum Tipi",
  [ReferenceTypes.BloodType]: "Kan Grubu",
  [ReferenceTypes.NationalityType]: "Uyruk Tipi",
};

/**
 * Reference Type Short Names
 * Her enum değeri için kısa isimler
 */
export const ReferenceTypeShortNames: Record<ReferenceTypes, string> = {
  [ReferenceTypes.AddressType]: "Adres",
  [ReferenceTypes.CommunicationOwnerType]: "İletişim",
  [ReferenceTypes.EmployeeDutyType]: "Görev",
  [ReferenceTypes.EmployeePassivityReasonType]: "Pasiflik",
  [ReferenceTypes.EmployeeTitleType]: "Unvan",
  [ReferenceTypes.GenderType]: "Cinsiyet",
  [ReferenceTypes.OrganizationType]: "Birim",
  [ReferenceTypes.PhoneNumberType]: "Telefon",
  [ReferenceTypes.EducationType]: "Eğitim",
  [ReferenceTypes.University]: "Üniversite",
  [ReferenceTypes.UniversityDepartment]: "Bölüm",
  [ReferenceTypes.MaritalStatusType]: "Medeni Durum",
  [ReferenceTypes.BloodType]: "Kan Grubu",
  [ReferenceTypes.NationalityType]: "Uyruk",
};
