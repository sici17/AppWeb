import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: 'risorse', loadComponent: () => import('./components/risorse/risorse.component').then(m => m.RisorseComponent) },
  { path: 'registrazione', loadComponent: () => import('./components/registration/registration.component').then(m => m.RegistrationComponent) },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  //{ path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) }
];