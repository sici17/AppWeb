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
          console.error('❌ Errore login utente:', error);
          return of(false);
        })
      );
  }

  // REGISTRAZIONE UTENTE IN KEYCLOAK CON SERVICE ACCOUNT
    registerUserInKeycloak(userData: RegistrationData): Observable<boolean> {
    console.log('📝 === INIZIO REGISTRAZIONE KEYCLOAK (SERVICE ACCOUNT) ===');
    console.log('Dati utente:', userData);
	
    return this.getAdminToken().pipe(
      switchMap((adminToken: string) => {
        console.log('🔑 Token service account ottenuto, procedo con creazione utente...');
        
        // URL per creare utente nel realm biblioteca
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

        console.log('🔧 === DETTAGLI CREAZIONE UTENTE ===');
        console.log('URL:', createUserUrl);
        console.log('Payload:', JSON.stringify(userPayload, null, 2));
        console.log('Usando Service Account Token del realm biblioteca');
        
        return this.http.post(createUserUrl, userPayload, { 
          headers,
          observe: 'response'
        }).pipe(
          tap(response => {
            console.log('✅ === RISPOSTA CREAZIONE UTENTE ===');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);
            console.log('Location Header:', response.headers.get('Location'));
          }),
          switchMap((response: any) => {
            const locationHeader = response.headers.get('Location');
            if (locationHeader) {
              const userId = locationHeader.substring(locationHeader.lastIndexOf('/') + 1);
              console.log('✅ Utente creato con ID:', userId);
              
              // Assegna il ruolo 'utente' nel realm biblioteca
              return this.assignRoleToUser(adminToken, userId, 'utente');
            } else {
              console.log('⚠️ Location header non trovato, ma status è', response.status);
              return of(true);
            }
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('❌ === ERRORE DETTAGLIATO CREAZIONE UTENTE ===');
            console.error('Status:', error.status);
            console.error('Status Text:', error.statusText);
            console.error('URL:', error.url);
            console.error('Error Body:', error.error);
            console.error('Message:', error.message);
            
            // Analisi dettagliata degli errori
            if (error.status === 403) {
              console.error('🚫 ERRORE 403 - Service Account senza permessi');
              console.error('Verifica che il service account biblioteca-client abbia ruolo manage-users');
              
            } else if (error.status === 409) {
              console.error('🔄 ERRORE 409 - Username o email già esistenti');
              console.error('Username:', userData.username);
              console.error('Email:', userData.email);
              
            } else if (error.status === 400) {
              console.error('📝 ERRORE 400 - Payload non valido');
              console.error('Controlla formato dati inviati');
              
            } else if (error.status === 401) {
              console.error('🔐 ERRORE 401 - Token service account non valido');
              console.error('Verifica Service Accounts Enabled per biblioteca-client');
            }
            
            return throwError(() => error);
          })
        );
      }),
      map(() => {
        console.log('✅ === REGISTRAZIONE KEYCLOAK COMPLETATA CON SERVICE ACCOUNT ===');
        return true;
      }),
      catchError(error => {
        console.error('❌ === ERRORE FINALE REGISTRAZIONE KEYCLOAK ===');
        console.error('Errore:', error.message);
        return of(false);
      })
    );
  }

  //  TOKEN ADMIN (usa service account del realm biblioteca)
  private getAdminToken(): Observable<string> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.adminRealm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('client_id', this.adminClientId);
    body.set('client_secret', this.adminClientSecret);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    console.log('🔑 === RICHIESTA TOKEN SERVICE ACCOUNT ===');
    console.log('URL:', tokenUrl);
    console.log('Client ID:', this.adminClientId);
    console.log('Grant Type: client_credentials');
    console.log('Realm:', this.adminRealm);
    
    return this.http.post<KeycloakTokenResponse>(tokenUrl, body.toString(), { headers })
      .pipe(
        tap(response => {
          console.log('✅ Token service account ottenuto con successo');
          console.log('Token type:', response.token_type);
          console.log('Expires in:', response.expires_in, 'secondi');
        }),
        map(response => response.access_token),
        catchError((error: HttpErrorResponse) => {
          console.error('❌ === ERRORE TOKEN SERVICE ACCOUNT ===');
          console.error('Status:', error.status);
          console.error('Error:', error.error);
          
          if (error.status === 401) {
            console.error('🔐 Client credentials non valide o Service Account non abilitato');
            console.error('Client ID:', this.adminClientId);
            console.error('Verifica:');
            console.error('1. Service Accounts Enabled: ON in biblioteca-client');
            console.error('2. Client Secret corretto');
            console.error('3. Service Account ha ruoli realm-management');
          }
          
          return throwError(() => error);
        })
      );
  }

  // ASSEGNAZIONE RUOLO (nel realm biblioteca)
  private assignRoleToUser(adminToken: string, userId: string, roleName: string): Observable<any> {
    console.log(`👑 Assegnazione ruolo '${roleName}' all'utente ${userId}`);
    
    const getRoleUrl = `${this.keycloakUrl}/admin/realms/${this.userRealm}/roles/${roleName}`;
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${adminToken}`
    });

    console.log('🔍 Recupero informazioni ruolo:', getRoleUrl);

    return this.http.get<any>(getRoleUrl, { headers }).pipe(
      tap(role => {
        console.log('✅ Ruolo trovato:', role);
      }),
      switchMap(role => {
        const assignRoleUrl = `${this.keycloakUrl}/admin/realms/${this.userRealm}/users/${userId}/role-mappings/realm`;
        console.log('📌 Assegnazione ruolo:', assignRoleUrl);
        
        return this.http.post(assignRoleUrl, [role], { headers }).pipe(
          tap(() => {
            console.log(`✅ Ruolo '${roleName}' assegnato con successo`);
          })
        );
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`❌ Errore assegnazione ruolo '${roleName}':`, error);
        
        if (error.status === 404) {
          console.error(`🔍 Ruolo '${roleName}' non trovato nel realm '${this.userRealm}'`);
          console.error('Crea il ruolo in Keycloak Admin Console');
        }
        
        // Non blocchiamo la registrazione se l'assegnazione del ruolo fallisce
        console.log('⚠️ Continuo senza assegnare il ruolo');
        return of(null);
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
  
  
  
  
  public async testIfBibliotecaClientRolesWork(): Promise<void> {
    console.log('🧪 === TEST: FUNZIONANO I RUOLI BIBLIOTECA-CLIENT? ===');
    
    try {
      // 1. Ottieni il token (che ha i ruoli in biblioteca-client)
      const adminToken = await this.getAdminToken().toPromise();
      
      if (!adminToken) {
        console.error('❌ Token non ottenuto');
        return;
      }
      
      console.log('✅ Token ottenuto');
      
      // 2. Test più semplice: prova a leggere le info del realm
      console.log('🔍 Test 1: Lettura info realm...');
      const realmInfoUrl = `${this.keycloakUrl}/admin/realms/${this.userRealm}`;
      
      const realmResponse = await fetch(realmInfoUrl, {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Realm info status:', realmResponse.status);
      
      if (realmResponse.status === 200) {
        console.log('✅ Può leggere info realm');
      } else if (realmResponse.status === 403) {
        console.error('❌ Non può leggere info realm - problema permessi');
      }
      
      // 3. Test intermedio: prova a leggere gli utenti
      console.log('🔍 Test 2: Lettura utenti...');
      const usersUrl = `${this.keycloakUrl}/admin/realms/${this.userRealm}/users?max=1`;
      
      const usersResponse = await fetch(usersUrl, {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Users list status:', usersResponse.status);
      
      if (usersResponse.status === 200) {
        console.log('✅ Può leggere lista utenti');
        const users = await usersResponse.json();
        console.log('👥 Numero utenti:', users.length);
      } else if (usersResponse.status === 403) {
        console.error('❌ Non può leggere utenti - problema permessi');
        const errorText = await usersResponse.text();
        console.error('Dettaglio errore:', errorText);
      }
      
      // 4. Test finale: prova a creare un utente semplice
      console.log('🔍 Test 3: Creazione utente test...');
      const createUserUrl = `${this.keycloakUrl}/admin/realms/${this.userRealm}/users`;
      
      const testUser = {
        username: `test-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        enabled: true,
        emailVerified: true,
        credentials: [{
          type: 'password',
          value: 'test123',
          temporary: false
        }]
      };
      
      const createResponse = await fetch(createUserUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      });
      
      console.log('📊 Create user status:', createResponse.status);
      
      if (createResponse.status === 201) {
        console.log('🎉 SUCCESS! I ruoli in biblioteca-client FUNZIONANO!');
        console.log('✅ Keycloak accetta i ruoli da biblioteca-client');
        
        const locationHeader = createResponse.headers.get('Location');
        if (locationHeader) {
          console.log('📍 Utente creato:', locationHeader);
        }
      } else if (createResponse.status === 403) {
        console.error('❌ FALLIMENTO! I ruoli in biblioteca-client NON funzionano');
        console.error('🔧 Devi spostare i ruoli a realm-management');
        
        const errorText = await createResponse.text();
        console.error('Dettaglio errore 403:', errorText);
      } else {
        console.log('⚠️ Status inaspettato:', createResponse.status);
        const responseText = await createResponse.text();
        console.log('Response:', responseText);
      }
      
      // 5. Conclusioni
      console.log('🎯 === CONCLUSIONI TEST ===');
      if (createResponse.status === 201) {
        console.log('✅ I tuoi ruoli biblioteca-client funzionano!');
        console.log('🔧 Il problema era solo nel debug code');
      } else {
        console.log('❌ I ruoli biblioteca-client non funzionano');
        console.log('🔧 Devi spostarli a realm-management');
      }
      
    } catch (error) {
      console.error('❌ Errore nel test:', error);
    }
  }

  // 🔧 Versione semplificata per test rapido
  public async quickTest(): Promise<boolean> {
    try {
      const token = await this.getAdminToken().toPromise();
      if (!token) return false;
      
      const response = await fetch(`${this.keycloakUrl}/admin/realms/${this.userRealm}/users?max=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('🧪 Quick test result:', response.status);
      return response.status === 200;
      
    } catch (error) {
      console.error('Quick test error:', error);
      return false;
    }
  }
  
}