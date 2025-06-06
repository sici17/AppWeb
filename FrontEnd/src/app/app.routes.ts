// src/app/app.routes.ts - VERSIONE CORRETTA
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
    path: 'tessere', 
    loadComponent: () => import('./components/tessere/tessere.component').then(m => m.TessereComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'user-dashboard',
    loadComponent: () => import('./components/user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent),
    canActivate: [AuthGuard]
  },

  // Rotte per amministratori
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AdminGuard]
  },

  // Catch-all route
  { path: '**', redirectTo: '/home' }
];