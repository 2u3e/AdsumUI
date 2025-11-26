import { FilterDrawerConfig } from "../../shared/components/filter-drawer/filter-config.interface";

/**
 * User Management page filter configuration
 */
export const USER_MANAGEMENT_FILTER_CONFIG: FilterDrawerConfig = {
  title: "Filtreleme Seçenekleri",
  clearButtonText: "Temizle",
  applyButtonText: "Uygula",
  fields: [
    {
      key: "fullName",
      label: "Ad Soyad",
      type: "text",
      placeholder: "Ad soyad ile ara...",
      clearable: true,
      colSpan: 2,
    },
    {
      key: "userName",
      label: "Kullanıcı Adı",
      type: "text",
      placeholder: "Kullanıcı adı ile ara...",
      clearable: true,
      colSpan: 2,
    },
    {
      key: "email",
      label: "E-posta",
      type: "text",
      placeholder: "E-posta ile ara...",
      clearable: true,
      colSpan: 2,
    },
    {
      key: "organizationId",
      label: "Birim",
      type: "multiselect",
      placeholder: "Birim seçiniz",
      searchable: true,
      clearable: true,
      options: [], // Will be populated dynamically
      colSpan: 2,
    },
    {
      key: "isActive",
      label: "Durum",
      type: "select",
      placeholder: "Durum seçiniz",
      clearable: true,
      options: [
        { id: "true", name: "Aktif" },
        { id: "false", name: "Pasif" },
      ],
      colSpan: 2,
    },
  ],
};
