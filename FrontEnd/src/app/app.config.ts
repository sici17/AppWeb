// src/app/app.config.ts - VERSIONE CORRETTA
import { ApplicationConfig, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

// Interceptor corretto
const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔍 Interceptor - URL:', req.method, req.url);
  
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Skip per endpoint pubblici
  if (shouldSkipToken(req)) {
    console.log('⏭️ Skip token per:', req.url);
    return next(req);
  }
  
  // Verifica autenticazione per endpoint protetti
  const token = authService.getToken();
  const isLoggedIn = authService.isLoggedIn();
  
  console.log('🔐 Token presente:', !!token);
  console.log('🔐 IsLoggedIn:', isLoggedIn);

  if (!isLoggedIn || !token) {
    console.log('❌ Non autenticato, redirect al login');
    router.navigate(['/login']);
    return throwError(() => new Error('Not authenticated'));
  }
  
  // Aggiungi token per endpoint protetti
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  
  console.log('📤 Token aggiunto alla richiesta');
  
  return next(authReq).pipe(
    catchError(error => {
      console.error('❌ Errore richiesta:', error.status, error.message);
      
      if (error.status === 401) {
        console.error('🔐 Token non valido, logout');
        authService.logout();
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};

function shouldSkipToken(req: any): boolean {
  // Skip per richieste a Keycloak
  if (req.url.includes('/realms/')) {
    return true;
  }
  
  // Endpoint pubblici
  const publicEndpoints = [
    '/users/registrazione',    // ✅ Endpoint registrazione
    '/api/utenti/all',        // ✅ Lista utenti pubblica
    '/api/tessere/tipologie'  // ✅ Tipologie tessere pubbliche
  ];
  
  // /api/risorse è pubblico solo per GET
  if (req.url.includes('/api/risorse') && req.method === 'GET') {
    return true;
  }
  
  return publicEndpoints.some(endpoint => req.url.includes(endpoint));
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};