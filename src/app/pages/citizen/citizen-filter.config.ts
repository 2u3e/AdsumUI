import { FilterDrawerConfig } from "../../shared/components/filter-drawer/filter-config.interface";

/**
 * Citizen page filter configuration
 */
export const CITIZEN_FILTER_CONFIG: FilterDrawerConfig = {
  title: "Filtreleme Seçenekleri",
  clearButtonText: "Temizle",
  applyButtonText: "Uygula",
  fields: [
    {
      key: "identityNumber",
      label: "TC Kimlik Numarası",
      type: "text",
      placeholder: "TC Kimlik No ile ara...",
      clearable: true,
      colSpan: 2,
    },
    {
      key: "name",
      label: "Ad",
      type: "text",
      placeholder: "Ad ile ara...",
      clearable: true,
      colSpan: 2,
    },
    {
      key: "lastName",
      label: "Soyad",
      type: "text",
      placeholder: "Soyad ile ara...",
      clearable: true,
      colSpan: 2,
    },
    {
      key: "genderId",
      label: "Cinsiyet",
      type: "multiselect",
      placeholder: "Cinsiyet seçiniz",
      searchable: true,
      clearable: true,
      options: [], // Will be populated dynamically
      colSpan: 2,
    },
  ],
};
