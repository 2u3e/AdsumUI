import { FilterDrawerConfig } from "../../shared/components/filter-drawer/filter-config.interface";

export const ROLE_FILTER_CONFIG: FilterDrawerConfig = {
  title: "Rol Filtreleme",
  fields: [
    {
      key: "name",
      label: "Rol Adı",
      type: "text",
      placeholder: "Rol adı ara...",
    },
    {
      key: "isSystem",
      label: "Rol Tipi",
      type: "select",
      placeholder: "Rol tipi seçin",
      options: [
        { id: "true", name: "Sistem Rolü" },
        { id: "false", name: "Özel Rol" },
      ],
    },
  ],
};
