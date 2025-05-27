// src/app/interceptors/auth.interceptor.ts - VERSIONE CORRETTA
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔍 Interceptor chiamato per:', req.method, req.url);
    
    // Non aggiungere token per le richieste a Keycloak o per endpoint pubblici
    if (this.shouldSkipToken(req)) {
      console.log('⏭️ Skipping token per URL pubblico:', req.url);
      return next.handle(req);
    }

    // Aggiungi il token di autenticazione
    const tokenizedReq = this.addToken(req);
    const token = this.authService.getToken();
    
    console.log('🔐 Token presente:', !!token);
    if (token) {
      console.log('🔐 Token (primi 50 caratteri):', token.substring(0, 50) + '...');
      console.log('✅ Authorization header aggiunto alla richiesta');
    } else {
      console.log('❌ NESSUN TOKEN DISPONIBILE per la richiesta protetta!');
    }

    return next.handle(tokenizedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Errore HTTP nell\'interceptor:', error.status, error.message);
        
        // Se errore 401, prova a rinnovare il token
        if (error.status === 401 && !this.shouldSkipToken(req)) {
          console.log('🔄 Tentativo refresh token per errore 401');
          return this.handle401Error(req, next);
        }
        
        return throwError(() => error);
      })
    );
  }

  private shouldSkipToken(req: HttpRequest<any>): boolean {
    // Skip per richieste a Keycloak
    if (req.url.includes('/realms/')) {
      return true;
    }
    
    // Skip per endpoint pubblici
    const publicEndpoints = [
      '/users/registrazione',
      '/api/utenti/all',
      '/api/tessere/tipologie'  // Solo il GET per le tipologie è pubblico
    ];
    
    // IMPORTANTE: /api/risorse è pubblico solo per GET
    if (req.url.includes('/api/risorse') && req.method === 'GET') {
      return true;
    }
    
    return publicEndpoints.some(endpoint => req.url.includes(endpoint));
  }

  private addToken(req: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getToken();
    
    if (token) {
      console.log('📤 Aggiungendo Authorization header con Bearer token');
      return req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
    
    console.log('⚠️ Nessun token da aggiungere');
    return req;
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((success: boolean) => {
          this.isRefreshing = false;
          
          if (success) {
            console.log('✅ Token refresh riuscito');
            this.refreshTokenSubject.next(this.authService.getToken());
            return next.handle(this.addToken(req));
          } else {
            console.log('❌ Token refresh fallito - redirect al login');
            this.authService.logout();
            this.router.navigate(['/login']);
            return throwError(() => new Error('Session expired'));
          }
        }),
        catchError((error) => {
          console.error('❌ Errore durante refresh token:', error);
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/login']);
          return throwError(() => error);
        })
      );
    } else {
      // Se è già in corso un refresh, aspetta che finisca
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => next.handle(this.addToken(req)))
      );
    }
  }
}