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
      label: "Birim Adı",
      type: "text",
      placeholder: "Birim adı ile ara...",
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
      label: "Üst Birim",
      type: "multiselect",
      placeholder: "Üst birim seçiniz",
      searchable: true,
      clearable: true,
      options: [], // Will be populated dynamically
      colSpan: 2,
    },
    {
      key: "typeId",
      label: "Birim Tipi",
      type: "multiselect",
      placeholder: "Tip seçiniz",
      searchable: true,
      clearable: true,
      options: [], // Will be populated dynamically
      colSpan: 2,
    },
  ],
};
