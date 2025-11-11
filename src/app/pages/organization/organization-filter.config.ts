import { FilterDrawerConfig } from "../../shared/components/filter-drawer/filter-config.interface";

/**
 * Organization page filter configuration
 */
export const ORGANIZATION_FILTER_CONFIG: FilterDrawerConfig = {
  title: "Filtreleme Seçenekleri",
  clearButtonText: "Temizle",
  applyButtonText: "Uygula",
  fields: [
    {
      key: "name",
      label: "Organizasyon Adı",
      type: "text",
      placeholder: "Organizasyon adı ile ara...",
      clearable: true,
      colSpan: 2,
    },
    {
      key: "shortName",
      label: "Kısa Ad",
      type: "text",
      placeholder: "Kısa ad ile ara...",
      clearable: true,
      colSpan: 2,
    },
    {
      key: "parentId",
      label: "Üst Organizasyon",
      type: "select",
      placeholder: "Üst organizasyon seçiniz",
      searchable: true,
      clearable: true,
      options: [], // Will be populated dynamically
      colSpan: 2,
    },
    {
      key: "typeId",
      label: "Organizasyon Tipi",
      type: "select",
      placeholder: "Tip seçiniz",
      searchable: true,
      clearable: true,
      options: [], // Will be populated dynamically
      colSpan: 2,
    },
  ],
};
