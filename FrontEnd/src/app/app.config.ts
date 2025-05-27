// src/app/app.config.ts - VERSIONE CON INTERCEPTOR FUNZIONALE
import { ApplicationConfig, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

// Interceptor funzionale che sostituisce AuthInterceptor
const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔍 === INTERCEPTOR FUNZIONALE ===');
  console.log('🔍 URL:', req.method, req.url);
  
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Skip per endpoint pubblici
  if (shouldSkipToken(req)) {
    console.log('⏭️ Skip token per:', req.url);
    return next(req);
  }
  
  // Verifica autenticazione
  const token = authService.getToken();
  const isLoggedIn = authService.isLoggedIn();
  
  console.log('🔐 IsLoggedIn:', isLoggedIn);
  console.log('🔐 Token presente:', !!token);
  
  if (!isLoggedIn || !token) {
    console.log('❌ Utente non autenticato');
    router.navigate(['/login']);
    return throwError(() => new Error('Not authenticated'));
  }
  
  // Aggiungi token
  console.log('📤 Aggiungendo token alla richiesta...');
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  
  console.log('📤 Token aggiunto. Headers:', authReq.headers.keys());
  console.log('📤 Authorization header:', authReq.headers.get('Authorization')?.substring(0, 50) + '...');
  
  return next(authReq).pipe(
    catchError(error => {
      console.error('❌ Errore richiesta:', error.status, error.message);
      
      if (error.status === 401) {
        console.error('❌ 401 Unauthorized - Token non valido?');
        // Potresti aggiungere qui la logica di refresh token
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
  
  // Skip per endpoint pubblici
  const publicEndpoints = [
    '/users/registrazione',
    '/api/utenti/all',
    '/api/tessere/tipologie'
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