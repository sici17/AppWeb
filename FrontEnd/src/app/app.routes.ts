// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard, AdminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  
  // Rotte pubbliche
  { 
    path: 'home', 
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'risorse', 
    loadComponent: () => import('./components/risorse/risorse.component').then(m => m.RisorseComponent) 
  },
  { 
    path: 'registrazione', 
    loadComponent: () => import('./components/registration/registration.component').then(m => m.RegistrationComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) 
  },

  // Rotte protette per utenti autenticati
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'user-dashboard',
    loadComponent: () => import('./components/user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent),
    canActivate: [AuthGuard],
    data: { roles: ['utente'] }
  },

  // Rotte per amministratori
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AdminGuard],
    data: { roles: ['admin'] }
  },

  // Rotte protette con ruoli specifici
  {
    path: 'prestiti',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    data: { roles: ['utente'] }
  },
  {
    path: 'tessere',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    data: { roles: ['utente'] }
  },

  // Catch-all route
  { path: '**', redirectTo: '/home' }
];