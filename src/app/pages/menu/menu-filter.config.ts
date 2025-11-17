import { FilterDrawerConfig } from "../../shared/components/filter-drawer/filter-config.interface";

/**
 * Menu page filter configuration
 */
export const MENU_FILTER_CONFIG: FilterDrawerConfig = {
  title: "Filtreleme Seçenekleri",
  clearButtonText: "Temizle",
  applyButtonText: "Uygula",
  fields: [
    {
      key: "code",
      label: "Menü Kodu",
      type: "text",
      placeholder: "Menü kodu ile ara...",
      clearable: true,
      colSpan: 2,
    },
    {
      key: "name",
      label: "Menü Adı",
      type: "text",
      placeholder: "Menü adı ile ara...",
      clearable: true,
      colSpan: 2,
    },
    {
      key: "parentId",
      label: "Üst Menü",
      type: "multiselect",
      placeholder: "Üst menü seçiniz",
      searchable: true,
      clearable: true,
      options: [], // Will be populated dynamically
      colSpan: 2,
    },
    {
      key: "menuType",
      label: "Menü Tipi",
      type: "select",
      placeholder: "Menü tipi seçiniz",
      clearable: true,
      options: [], // Will be populated dynamically from reference data
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
      colSpan: 1,
    },
    {
      key: "isVisible",
      label: "Görünürlük",
      type: "select",
      placeholder: "Görünürlük seçiniz",
      clearable: true,
      options: [
        { id: "true", name: "Görünür" },
        { id: "false", name: "Gizli" },
      ],
      colSpan: 1,
    },
  ],
};
