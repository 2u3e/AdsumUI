import { Routes } from '@angular/router';

import { LoginComponent } from './layouts/login/login.component';
import { LayoutsComponent } from './layouts/layouts.component';
import { IndexComponent } from './pages/index/index.component';
import { Demo1Component } from './layouts/demo1/demo1.component';
import { IndexComponent as Demo1IndexComponent } from './pages/demo1/index/index.component';

import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [loginGuard]
  },
  { 
    path: '', 
    pathMatch: 'full', 
    component: LayoutsComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '', 
        component: IndexComponent
      }
    ]
  },
  {
    path: 'demo1',
    component: Demo1Component,
    canActivate: [authGuard],
    children: [
      { path: '', component: Demo1IndexComponent },
    ],
  },
  // 404 sayfası için wildcard route
  {
    path: '**',
    redirectTo: ''
  }
];