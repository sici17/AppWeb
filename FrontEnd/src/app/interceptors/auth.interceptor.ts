// src/app/interceptors/auth.interceptor.ts
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
    // Non aggiungere token per le richieste a Keycloak o per endpoint pubblici
    if (this.shouldSkipToken(req)) {
      return next.handle(req);
    }

    // Aggiungi il token di autenticazione
    req = this.addToken(req);

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Se errore 401, prova a rinnovare il token
        if (error.status === 401 && !this.shouldSkipToken(req)) {
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
      '/api/risorse',
      '/api/tessere/tipologie'
    ];
    
    return publicEndpoints.some(endpoint => req.url.includes(endpoint));
  }

  private addToken(req: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getToken();
    
    if (token) {
      return req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
    
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
            this.refreshTokenSubject.next(this.authService.getToken());
            return next.handle(this.addToken(req));
          } else {
            // Refresh fallito, redirect al login
            this.authService.logout();
            this.router.navigate(['/login']);
            return throwError(() => new Error('Session expired'));
          }
        }),
        catchError((error) => {
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