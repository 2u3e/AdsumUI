import { FilterDrawerConfig } from "../../shared/components/filter-drawer/filter-config.interface";

/**
 * WorkType page filter configuration
 */
export const WORK_TYPE_FILTER_CONFIG: FilterDrawerConfig = {
  title: "Filtreleme Seçenekleri",
  clearButtonText: "Temizle",
  applyButtonText: "Uygula",
  fields: [
    {
      key: "name",
      label: "İş Tipi Adı",
      type: "text",
      placeholder: "İş tipi adı ile ara...",
      clearable: true,
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
    {
      key: "isCreatable",
      label: "Oluşturulabilir",
      type: "select",
      placeholder: "Seçiniz",
      clearable: true,
      options: [
        { id: "true", name: "Evet" },
        { id: "false", name: "Hayır" },
      ],
      colSpan: 2,
    },
  ],
};
