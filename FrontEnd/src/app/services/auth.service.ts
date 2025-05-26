// src/app/services/auth.service.ts - VERSIONE CORRETTA
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

export interface UserInfo {
  sub: string;
  preferred_username: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  realm_access?: {
    roles: string[];
  };
}

export interface RegistrationData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private keycloakUrl = 'http://localhost:8080';
  
  // 👥 CONFIGURAZIONE PER LOGIN UTENTI (realm biblioteca)
  private userRealm = 'biblioteca';
  private userClientId = 'biblioteca-client';
  private userClientSecret = 'hQtzUtWZnQxmjK5MGjLS7iPPj3x4xPam'; // Client secret del realm biblioteca
  
  // 🔧 CONFIGURAZIONE PER ADMIN API (realm master)
  private adminRealm = 'master';
  private adminClientId = 'admin-cli'; // O il client personalizzato che hai creato
  private adminUsername = 'admin';
  private adminPassword = 'admin';

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      this.loadUserFromToken();
    }
  }

  // 👤 LOGIN UTENTE (usa realm biblioteca)
  login(credentials: LoginCredentials): Observable<boolean> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.userRealm}/protocol/openid-connect/token`;
    
    console.log('🔐 Tentativo di login utente:', {
      url: tokenUrl,
      clientId: this.userClientId,
      username: credentials.username,
      realm: this.userRealm
    });

    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', this.userClientId);
    body.set('client_secret', this.userClientSecret);
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<KeycloakTokenResponse>(tokenUrl, body.toString(), { headers })
      .pipe(
        tap(response => {
          console.log('✅ Login utente riuscito');
          if (this.isBrowser) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            
            const expiresAt = Date.now() + (response.expires_in * 1000);
            localStorage.setItem('token_expires_at', expiresAt.toString());
            
            this.loadUserFromToken();
          }
        }),
        map(() => true),
        catchError(error => {
          console.error('❌ Errore login utente:', error);
          return of(false);
        })
      );
  }

  // Aggiornamento solo del metodo registerUserInKeycloak con debug dettagliato

  registerUserInKeycloak(userData: RegistrationData): Observable<boolean> {
    console.log('📝 Registrazione utente in Keycloak:', userData.username);
    
    return this.getAdminToken().pipe(
      switchMap((adminToken: string) => {
        // Crea utente nel realm biblioteca
        const createUserUrl = `${this.keycloakUrl}/admin/realms/${this.userRealm}/users`;
        
        const userPayload = {
          username: userData.username,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          enabled: true,
          emailVerified: true,
          credentials: [{
            type: 'password',
            value: userData.password,
            temporary: false
          }]
        };

        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        });

        console.log('🔧 Dettagli creazione utente:');
        console.log('- URL:', createUserUrl);
        console.log('- Payload:', userPayload);
        console.log('- Headers:', headers);
        console.log('- Token admin (primi 50 caratteri):', adminToken.substring(0, 50) + '...');
        
        return this.http.post(createUserUrl, userPayload, { 
          headers,
          observe: 'response'
        }).pipe(
          tap(response => {
            console.log('✅ Risposta creazione utente:', {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers.keys(),
              location: response.headers.get('Location')
            });
          }),
          switchMap((response: any) => {
            const locationHeader = response.headers.get('Location');
            if (locationHeader) {
              const userId = locationHeader.substring(locationHeader.lastIndexOf('/') + 1);
              console.log('✅ Utente creato con ID:', userId);
              
              // Assegna il ruolo nel realm biblioteca
              return this.assignRoleToUser(adminToken, userId, 'utente');
            } else {
              console.warn('⚠️ Location header non trovato, ma utente probabilmente creato');
              return of(true); // Considera comunque come successo
            }
          }),
          catchError(error => {
            console.error('❌ ERRORE DETTAGLIATO CREAZIONE UTENTE:');
            console.error('- Status:', error.status);
            console.error('- Status Text:', error.statusText);
            console.error('- URL:', error.url);
            console.error('- Error Response:', error.error);
            console.error('- Headers:', error.headers);
            
            // Log dettagliato dell'errore
            if (error.status === 403) {
              console.error('🚫 ERRORE 403: Token admin non ha permessi per creare utenti');
              console.error('   Verifica che l\'utente admin abbia il ruolo "manage-users" nel realm biblioteca');
            } else if (error.status === 409) {
              console.error('🔄 ERRORE 409: Utente già esistente');
              console.error('   Username o email già in uso');
            } else if (error.status === 400) {
              console.error('📝 ERRORE 400: Payload non valido');
              console.error('   Controlla la struttura dei dati inviati');
            }
            
            throw error;
          })
        );
      }),
      map(() => {
        console.log('✅ Registrazione Keycloak completata');
        return true;
      }),
      catchError(error => {
        console.error('❌ Errore finale registrazione Keycloak:', error);
        return of(false);
      })
    );
  }
  // 🔑 TOKEN ADMIN (usa realm master)
  private getAdminToken(): Observable<string> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.adminRealm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', this.adminClientId);
    body.set('username', this.adminUsername);
    body.set('password', this.adminPassword);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    console.log('🔑 Richiesta token admin dal realm master...');
    
    return this.http.post<KeycloakTokenResponse>(tokenUrl, body.toString(), { headers })
      .pipe(
        map(response => {
          console.log('✅ Token admin ottenuto');
          return response.access_token;
        }),
        catchError(error => {
          console.error('❌ Errore token admin:', error);
          throw error;
        })
      );
  }

  // 👑 ASSEGNAZIONE RUOLO (nel realm biblioteca)
  private assignRoleToUser(adminToken: string, userId: string, roleName: string): Observable<any> {
    const getRoleUrl = `${this.keycloakUrl}/admin/realms/${this.userRealm}/roles/${roleName}`;
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${adminToken}`
    });

    return this.http.get<any>(getRoleUrl, { headers }).pipe(
      switchMap(role => {
        const assignRoleUrl = `${this.keycloakUrl}/admin/realms/${this.userRealm}/users/${userId}/role-mappings/realm`;
        return this.http.post(assignRoleUrl, [role], { headers });
      }),
      tap(() => console.log(`✅ Ruolo '${roleName}' assegnato`)),
      catchError(error => {
        console.error(`❌ Errore assegnazione ruolo:`, error);
        return of(null);
      })
    );
  }

  // 🚪 LOGOUT UTENTE (usa realm biblioteca)
  logout(): void {
    if (!this.isBrowser) return;

    const logoutUrl = `${this.keycloakUrl}/realms/${this.userRealm}/protocol/openid-connect/logout`;
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      const body = new URLSearchParams();
      body.set('client_id', this.userClientId);
      body.set('client_secret', this.userClientSecret);
      body.set('refresh_token', refreshToken);

      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      this.http.post(logoutUrl, body.toString(), { headers }).subscribe({
        next: () => console.log('✅ Logout completato'),
        error: () => console.log('⚠️ Errore logout, procedo comunque')
      });
    }

    this.clearTokens();
  }

  // 🔄 REFRESH TOKEN (usa realm biblioteca)
  refreshToken(): Observable<boolean> {
    if (!this.isBrowser) return of(false);

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return of(false);

    const tokenUrl = `${this.keycloakUrl}/realms/${this.userRealm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', this.userClientId);
    body.set('client_secret', this.userClientSecret);
    body.set('refresh_token', refreshToken);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<KeycloakTokenResponse>(tokenUrl, body.toString(), { headers })
      .pipe(
        tap(response => {
          if (this.isBrowser) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            
            const expiresAt = Date.now() + (response.expires_in * 1000);
            localStorage.setItem('token_expires_at', expiresAt.toString());
            
            this.loadUserFromToken();
          }
        }),
        map(() => true),
        catchError(() => {
          this.clearTokens();
          return of(false);
        })
      );
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;

    const token = localStorage.getItem('access_token');
    const expiresAt = localStorage.getItem('token_expires_at');
    
    if (!token || !expiresAt) return false;

    if (Date.now() >= parseInt(expiresAt)) {
      this.refreshToken().subscribe();
      return false;
    }

    return true;
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('access_token');
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.realm_access?.roles?.includes(role) || false;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isUser(): boolean {
    return this.hasRole('utente');
  }

  // 🔗 TEST CONNESSIONE (testa realm biblioteca)
  testKeycloakConnection(): Observable<any> {
    const realmUrl = `${this.keycloakUrl}/realms/${this.userRealm}`;
    console.log('🔗 Test connessione a:', realmUrl);
    
    return this.http.get(realmUrl).pipe(
      tap(response => console.log('✅ Keycloak raggiungibile:', response)),
      catchError(error => {
        console.error('❌ Errore connessione:', error);
        return throwError(() => error);
      })
    );
  }

  private loadUserFromToken(): void {
    if (!this.isBrowser) {
      this.currentUserSubject.next(null);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      this.currentUserSubject.next(null);
      return;
    }

    try {
      const payload = this.decodeJWT(token);
      if (payload) {
        console.log('👤 Utente caricato:', payload);
        this.currentUserSubject.next(payload);
      }
    } catch (error) {
      console.error('Errore parsing token:', error);
      this.clearTokens();
    }
  }

  private decodeJWT(token: string): UserInfo | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as UserInfo;
    } catch (error) {
      console.error('Errore decodifica JWT:', error);
      return null;
    }
  }

  private clearTokens(): void {
    if (!this.isBrowser) return;

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    this.currentUserSubject.next(null);
  }

  getUserInfo(): Observable<UserInfo> {
    const userInfoUrl = `${this.keycloakUrl}/realms/${this.userRealm}/protocol/openid-connect/userinfo`;
    const token = this.getToken();
    
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<UserInfo>(userInfoUrl, { headers })
      .pipe(
        tap(userInfo => this.currentUserSubject.next(userInfo)),
        catchError(error => {
          console.error('Errore info utente:', error);
          return throwError(() => error);
        })
      );
  }
}