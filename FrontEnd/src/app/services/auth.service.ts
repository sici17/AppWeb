import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';

export interface LoginCredentials {
  username: string;
  password: string;
}


export interface JWTPayload {
  sub: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  azp?: string;           // Authorized party (client ID)
  client_id?: string;     // Client ID alternativo
  iss: string;            // Issuer
  aud: string | string[]; // Audience
  exp: number;            // Expiration time
  iat: number;            // Issued at
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  scope?: string;
  typ?: string;
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
  
  //  CONFIGURAZIONE PER LOGIN UTENTI (realm biblioteca)
  private userRealm = 'biblioteca';
  private userClientId = 'biblioteca-client';
  private userClientSecret = 'hQtzUtWZnQxmjK5MGjLS7iPPj3x4xPam';
  
  // CONFIGURAZIONE PER ADMIN API (usa service account dello stesso realm)
  private adminRealm = 'biblioteca';
  private adminClientId = 'biblioteca-client';
  private adminClientSecret = 'hQtzUtWZnQxmjK5MGjLS7iPPj3x4xPam';

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

  //  LOGIN UTENTE 
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
          console.error(' Errore login utente:', error);
          return of(false);
        })
      );
  }

  registerUserInKeycloak(userData: RegistrationData): Observable<boolean> {
    console.log(' === INIZIO REGISTRAZIONE KEYCLOAK ===');
    console.log('Dati utente:', userData);

    return this.getAdminToken().pipe(
      switchMap((adminToken: string) => {
        console.log('🔑 Token admin ottenuto, procedo con creazione utente...');
        
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

        console.log('🔧 Creazione utente con payload:', userPayload);
        
        return this.http.post(createUserUrl, userPayload, { 
          headers,
          observe: 'response'
        }).pipe(
          tap(response => {
            console.log(' Risposta creazione utente - Status:', response.status);
          }),
          switchMap((response: any) => {
            // Cerca di assegnare il ruolo 'utente'
            const locationHeader = response.headers.get('Location');
            if (locationHeader) {
              const userId = locationHeader.substring(locationHeader.lastIndexOf('/') + 1);
              console.log(' Utente creato con ID:', userId);
              
              return this.assignRoleToUser(adminToken, userId, 'utente').pipe(
                map(() => true),
                catchError((roleError) => {
                  console.warn(' Errore assegnazione ruolo, ma utente creato:', roleError);
                  return of(true); // Non blocchiamo la registrazione per errori di ruolo
                })
              );
            } else {
              console.log(' Location header non trovato, ma utente probabilmente creato');
              return of(true);
            }
          }),
          catchError((error: HttpErrorResponse) => {
            console.error(' Errore creazione utente:', error);
            
            if (error.status === 409) {
              console.error('Username o email già esistenti');
            } else if (error.status === 403) {
              console.error('Permessi insufficienti per service account');
            } else if (error.status === 400) {
              console.error('Dati non validi:', error.error);
            }
            
            return throwError(() => error);
          })
        );
      }),
      catchError(error => {
        console.error('Errore generale registrazione:', error);
        return of(false);
      })
    );
  }


  private getAdminToken(): Observable<string> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.adminRealm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('client_id', this.adminClientId);
    body.set('client_secret', this.adminClientSecret);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    console.log('🔑 === DETTAGLI RICHIESTA TOKEN ===');
    console.log('🔑 URL:', tokenUrl);
    console.log('🔑 Client ID:', this.adminClientId);
    console.log('🔑 Realm:', this.adminRealm);
    console.log('🔑 Grant type: client_credentials');
    
    return this.http.post<KeycloakTokenResponse>(tokenUrl, body.toString(), { headers })
      .pipe(
        tap(response => {
          console.log(' Token service account ottenuto');
          console.log(' Token type:', response.token_type);
          console.log(' Expires in:', response.expires_in);
          
          // 🧪 DEBUG CRITICO: Decodifica e verifica contenuto token
          try {
            const payload = this.decodeJWT(response.access_token);
            console.log(' === CONTENUTO TOKEN COMPLETO ===');
            console.log(' Subject (sub):', payload?.sub);
            console.log(' Client ID (azp):', payload?.azp);
            console.log(' Issuer (iss):', payload?.iss);
            console.log(' Audience (aud):', payload?.aud);
            console.log(' Realm Access:', payload?.realm_access);
            console.log(' Resource Access:', payload?.resource_access);
            
            // Verifica specificamente i ruoli realm-management
            const resourceAccess = payload?.resource_access;
            if (resourceAccess && resourceAccess['realm-management']) {
              console.log(' Ruoli realm-management trovati:', resourceAccess['realm-management'].roles);
            } else {
              console.error(' PROBLEMA: Nessun ruolo realm-management nel token!');
              console.error(' Resource access disponibili:', Object.keys(resourceAccess || {}));
            }
            
            // Verifica ruoli generali
            if (payload?.realm_access?.roles) {
              console.log(' Ruoli realm:', payload.realm_access.roles);
            }
            
          } catch (e) {
            console.error(' Errore decodifica token:', e);
          }
        }),
        map(response => response.access_token),
        catchError((error: HttpErrorResponse) => {
          console.error(' === ERRORE TOKEN SERVICE ACCOUNT ===');
          console.error(' Status:', error.status);
          console.error(' Error body:', error.error);
          console.error(' URL:', error.url);
          
          if (error.status === 401) {
            console.error(' CREDENZIALI NON VALIDE:');
            console.error(' - Verifica client_id:', this.adminClientId);
            console.error(' - Verifica client_secret è corretto');
            console.error(' - Verifica Service Accounts abilitato');
          }
          
          return throwError(() => error);
        })
      );
  }

  private assignRoleToUser(adminToken: string, userId: string, roleName: string): Observable<any> {
    console.log(` Assegnazione ruolo '${roleName}' all'utente ${userId}`);
    
    const getRoleUrl = `${this.keycloakUrl}/admin/realms/${this.userRealm}/roles/${roleName}`;
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${adminToken}`
    });

    return this.http.get<any>(getRoleUrl, { headers }).pipe(
      switchMap(role => {
        const assignRoleUrl = `${this.keycloakUrl}/admin/realms/${this.userRealm}/users/${userId}/role-mappings/realm`;
        
        return this.http.post(assignRoleUrl, [role], { headers }).pipe(
          tap(() => {
            console.log(` Ruolo '${roleName}' assegnato con successo`);
          })
        );
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(` Errore assegnazione ruolo '${roleName}':`, error);
        
        if (error.status === 404) {
          console.error(` Ruolo '${roleName}' non trovato nel realm`);
        }
        
        return throwError(() => error);
      })
    );
  }

  // Altri metodi rimangono uguali...
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

  testKeycloakConnection(): Observable<any> {
    const realmUrl = `${this.keycloakUrl}/realms/${this.userRealm}`;
    console.log(' Test connessione a:', realmUrl);
    
    return this.http.get(realmUrl).pipe(
      tap(response => console.log('Keycloak raggiungibile:', response)),
      catchError(error => {
        console.error(' Errore connessione:', error);
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

  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error(' Token JWT malformato');
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const parsed = JSON.parse(decoded);
      
      console.log(' Raw token payload (primi 200 char):', decoded.substring(0, 200) + '...');
      
      return parsed;
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