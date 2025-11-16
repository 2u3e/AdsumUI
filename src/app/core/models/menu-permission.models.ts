export interface MenuPermissionItem {
  menuPermissionId: string;
  permissionId: number;
  permissionCode: string | null;
  permissionName: string | null;
}

export interface GetMenuTreeWithPermissionsResponse {
  id: string;
  parentId: string | null;
  code: string | null;
  name: string | null;
  route: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  description: string | null;
  permissions: MenuPermissionItem[] | null;
  children: GetMenuTreeWithPermissionsResponse[] | null;
}
