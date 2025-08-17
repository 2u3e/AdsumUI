import { Routes } from '@angular/router';

import { LoginComponent } from './layouts/login/login.component';

import { LayoutsComponent } from './layouts/layouts.component';
import { IndexComponent } from './pages/index/index.component';

import { Demo1Component } from './layouts/demo1/demo1.component';
import { IndexComponent as Demo1IndexComponent } from './pages/demo1/index/index.component';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent
  },
  { 
    path: '', 
    pathMatch: 'full', 
    component: LayoutsComponent,
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
    children: [
      { path: '', component: Demo1IndexComponent },
    ],
  }
];
