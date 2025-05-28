// src/app/app.component.ts
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from './services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  // src/app/app.component.ts - NAVBAR AGGIORNATA
  // ... (mantieni tutto il codice esistente, solo il template cambia)

    template: `
      <nav class="navbar">
        <div class="nav-brand">
          <a routerLink="/home">🏛️ Biblioteca Universitaria</a>
        </div>
        
        <div class="nav-links">
          <a routerLink="/home">Home</a>
          <a routerLink="/risorse">Catalogo</a>
          
          @if (!currentUser) {
            <!-- Menu per utenti non autenticati -->
            <a routerLink="/registrazione">Registrati</a>
            <a routerLink="/login" class="btn-login">Accedi</a>
          } @else {
            <!-- Menu per utenti autenticati -->
            <a routerLink="/dashboard">Dashboard</a>
            <a routerLink="/tessere">🎫 Tessere</a>
            
            @if (isAdmin) {
              <a routerLink="/admin-dashboard" class="btn-admin">Admin</a>
            }
            
            <div class="user-menu">
              <span class="user-name">{{ currentUser.given_name || currentUser.preferred_username }}</span>
              <button (click)="logout()" class="btn-logout">Logout</button>
            </div>
          }
        </div>
      </nav>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .nav-brand a {
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .nav-brand a:hover {
      color: #3498db;
    }
    
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .nav-links a, .nav-links button {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.3s ease;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 1rem;
    }
    
    .nav-links a:hover, .nav-links button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
    
    .btn-login {
      background-color: #3498db !important;
      color: white !important;
      font-weight: 600;
    }

    .btn-login:hover {
      background-color: #2980b9 !important;
      box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
    }

    .btn-admin {
      background-color: #e74c3c !important;
      color: white !important;
      font-weight: 600;
    }

    .btn-admin:hover {
      background-color: #c0392b !important;
      box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-left: 1rem;
      border-left: 1px solid rgba(255, 255, 255, 0.2);
    }

    .user-name {
      font-weight: 600;
      color: #ecf0f1;
    }

    .btn-logout {
      background-color: #95a5a6 !important;
      color: white !important;
      font-size: 0.9rem;
      padding: 0.4rem 0.8rem !important;
    }

    .btn-logout:hover {
      background-color: #7f8c8d !important;
    }
    
    .main-content {
      min-height: calc(100vh - 70px);
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }

    @media (max-width: 768px) {
      .navbar {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }
      
      .nav-links {
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
      }

      .user-menu {
        border-left: none;
        padding-left: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        padding-top: 0.5rem;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'biblioteca-frontend';
  currentUser: UserInfo | null = null;
  isAdmin = false;
  private subscription = new Subscription();
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Sottoscrivi ai cambiamenti dello stato utente
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.isAdmin = this.authService.isAdmin();
      })
    );

    // Solo nel browser, se c'è un token salvato, prova a caricare le info utente
    if (this.isBrowser && this.authService.isLoggedIn()) {
      this.authService.getUserInfo().subscribe({
        next: (userInfo) => {
          console.log('Info utente caricate:', userInfo);
        },
        error: (error) => {
          console.log('Errore caricamento info utente:', error);
          // Token probabilmente scaduto, verrà gestito dall'interceptor
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}