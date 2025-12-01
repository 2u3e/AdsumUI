import { Routes } from "@angular/router";

import { LoginComponent } from "./layouts/login/login.component";
import { LayoutsComponent } from "./layouts/layouts.component";
import { IndexComponent } from "./pages/index/index.component";
import { Demo1Component } from "./layouts/demo1/demo1.component";
import { IndexComponent as Demo1IndexComponent } from "./pages/demo1/index/index.component";
import { UserManagementComponent } from "./pages/user-management/user-management.component";
import { ReferenceComponent } from "./pages/reference/reference.component";
import { LookupComponent } from "./pages/lookup/lookup.component";
import { CitizenComponent } from "./pages/citizen/citizen.component";
import { OrganizationComponent } from "./pages/organization/organization.component";
import { MenuComponent } from "./pages/menu/menu.component";
import { RoleComponent } from "./pages/role/role.component";
import { WorkTypeComponent } from "./pages/work-type/work-type.component";

import { authGuard, loginGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "login",
    component: LoginComponent,
    canActivate: [loginGuard],
  },
  {
    path: "",
    component: LayoutsComponent,
    canActivate: [authGuard],
    children: [
      {
        path: "",
        component: IndexComponent,
      },
      {
        path: "user-management",
        component: UserManagementComponent,
      },
      {
        path: "reference",
        component: ReferenceComponent,
      },
      {
        path: "reference-data",
        component: LookupComponent,
      },
      {
        path: "citizen",
        component: CitizenComponent,
      },
      {
        path: "organization",
        component: OrganizationComponent,
      },
      {
        path: "menu",
        component: MenuComponent,
      },
      {
        path: "role",
        component: RoleComponent,
      },
      {
        path: "work-type",
        component: WorkTypeComponent,
      },
    ],
  },
  {
    path: "demo1",
    component: Demo1Component,
    canActivate: [authGuard],
    children: [{ path: "", component: Demo1IndexComponent }],
  },
  // 404 sayfası için wildcard route
  {
    path: "**",
    redirectTo: "",
  },
];
