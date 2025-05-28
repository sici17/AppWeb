// src/app/interceptors/auth.interceptor.ts - VERSIONE CON DEBUG DETTAGLIATO
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, tap } from 'rxjs/operators';
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
    console.log('🔍 === INTERCEPTOR START ===');
    console.log('🔍 URL:', req.method, req.url);
    console.log('🔍 Headers originali:', req.headers.keys());
    
    // Non aggiungere token per le richieste a Keycloak o per endpoint pubblici
    if (this.shouldSkipToken(req)) {
      console.log('⏭️ Skipping token per URL pubblico:', req.url);
      return next.handle(req);
    }

    // Verifica stato autenticazione PRIMA di procedere
    const isLoggedIn = this.authService.isLoggedIn();
    const token = this.authService.getToken();
    
    console.log('🔐 === STATO AUTENTICAZIONE ===');
    console.log('🔐 IsLoggedIn:', isLoggedIn);
    console.log('🔐 Token presente:', !!token);
    
    if (!isLoggedIn) {
      console.log('❌ UTENTE NON LOGGATO secondo AuthService');
      this.router.navigate(['/login']);
      return throwError(() => new Error('User not logged in'));
    }
    
    if (!token) {
      console.log('❌ NESSUN TOKEN DISPONIBILE');
      this.router.navigate(['/login']);
      return throwError(() => new Error('No token available'));
    }

    console.log('🎫 Token (primi 100 char):', token.substring(0, 100) + '...');

    // Aggiungi il token di autenticazione
    const tokenizedReq = this.addToken(req);
    
    console.log('📤 === RICHIESTA MODIFICATA ===');
    console.log('📤 Headers dopo aggiunta token:', tokenizedReq.headers.keys());
    
    const authHeader = tokenizedReq.headers.get('Authorization');
    console.log('📤 Authorization header presente:', !!authHeader);
    if (authHeader) {
      console.log('📤 Authorization header (primi 50 char):', authHeader.substring(0, 50) + '...');
    }

    console.log('📤 Invio richiesta al backend...');

    return next.handle(tokenizedReq).pipe(
      tap(event => {
        // Log di successo
        if (event.type === 0) { // HttpEventType.Sent
          console.log('📤 Richiesta inviata al backend');
        } else if (event.type === 4) { // HttpEventType.Response
          console.log('✅ Risposta ricevuta dal backend:', event);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ === ERRORE HTTP INTERCEPTOR ===');
        console.error('❌ Status:', error.status);
        console.error('❌ StatusText:', error.statusText);
        console.error('❌ URL:', error.url);
        console.error('❌ Error body:', error.error);
        console.error('❌ Message:', error.message);
        console.error('❌ Headers:', error.headers);
        console.error('❌ Error completo:', error);
        
        // Verifica se è un errore di rete o del server
        if (error.status === 0) {
          console.error('❌ ERRORE DI RETE - Backend non raggiungibile?');
        } else if (error.status === 401) {
          console.error('❌ ERRORE 401 - Token non valido o scaduto');
          
          // Prova il refresh token solo se non è già in corso
          if (!this.shouldSkipToken(req)) {
            console.log('🔄 Tentativo refresh token per errore 401');
            return this.handle401Error(req, next);
          }
        } else if (error.status >= 500) {
          console.error('❌ ERRORE SERVER - Problema del backend');
        }
        
        return throwError(() => error);
      })
    );
  }

  private shouldSkipToken(req: HttpRequest<any>): boolean {
    // Skip per richieste a Keycloak
    if (req.url.includes('/realms/')) {
      console.log('⏭️ Skip token: richiesta Keycloak');
      return true;
    }
    
    // Skip per endpoint pubblici
    const publicEndpoints = [
      '/users/registrazione',
      '/api/utenti/all',
      '/api/tessere/tipologie'
    ];
    
    // IMPORTANTE: /api/risorse è pubblico solo per GET
    if (req.url.includes('/api/risorse') && req.method === 'GET') {
      console.log('⏭️ Skip token: risorsa GET pubblica');
      return true;
    }
    
    const isPublic = publicEndpoints.some(endpoint => req.url.includes(endpoint));
    if (isPublic) {
      console.log('⏭️ Skip token: endpoint pubblico');
    }
    
    return isPublic;
  }

  private addToken(req: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getToken();
    
    if (!token) {
      console.log('⚠️ Nessun token da aggiungere');
      return req;
    }
    
    console.log('📤 === AGGIUNTA TOKEN ===');
    console.log('📤 Token lunghezza:', token.length);
    console.log('📤 Token valido (non vuoto):', token.trim().length > 0);
    
    const modifiedReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📤 Header Authorization aggiunto');
    console.log('📤 Headers della richiesta clonata:', modifiedReq.headers.keys());
    
    return modifiedReq;
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      console.log('🔄 === REFRESH TOKEN ===');
      console.log('🔄 Tentativo refresh token...');
      
      return this.authService.refreshToken().pipe(
        switchMap((success: boolean) => {
          this.isRefreshing = false;
          
          if (success) {
            console.log('✅ Token refresh riuscito');
            const newToken = this.authService.getToken();
            console.log('✅ Nuovo token ottenuto:', !!newToken);
            this.refreshTokenSubject.next(newToken);
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
      console.log('🔄 Refresh già in corso, attendo...');
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => next.handle(this.addToken(req)))
      );
    }
  }
}