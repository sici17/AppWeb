// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserInfo } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Dashboard Biblioteca</h1>
        <div class="user-info">
          @if (currentUser) {
            <span>Benvenuto, {{ currentUser.given_name }}!</span>
            <button (click)="logout()" class="btn btn-outline">Logout</button>
          }
        </div>
      </header>

      @if (currentUser) {
        <div class="dashboard-content">
          <div class="user-card">
            <h2>I tuoi dati</h2>
            <p><strong>Nome:</strong> {{ currentUser.name }}</p>
            <p><strong>Email:</strong> {{ currentUser.email }}</p>
            <p><strong>Username:</strong> {{ currentUser.preferred_username }}</p>
            <div class="roles">
              <strong>Ruoli:</strong>
              @for (role of currentUser.realm_access?.roles; track role) {
                <span class="role-badge">{{ role }}</span>
              }
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>Crediti</h3>
              @if (crediti !== null) {
                <p class="stat-number">{{ crediti }}</p>
              } @else {
                <p>Caricamento...</p>
              }
            </div>

            <div class="stat-card">
              <h3>Prestiti attivi</h3>
              <p class="stat-number">{{ prestitiAttivi.length }}</p>
            </div>

            <div class="stat-card">
              <h3>Tessere</h3>
              <p class="stat-number">{{ tessere.length }}</p>
            </div>
          </div>

          <div class="actions-section">
            <h2>Azioni rapide</h2>
            <div class="action-buttons">
              <button (click)="navigateTo('/risorse')" class="btn btn-primary">
                Sfoglia Catalogo
              </button>
              <button (click)="loadUserData()" class="btn btn-secondary">
                Ricarica Dati
              </button>
              @if (isAdmin) {
                <button (click)="navigateTo('/admin')" class="btn btn-admin">
                  Pannello Admin
                </button>
              }
            </div>
          </div>

          @if (error) {
            <div class="alert alert-error">
              {{ error }}
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #eee;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .dashboard-content {
      display: grid;
      gap: 2rem;
    }
    
    .user-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .roles {
      margin-top: 1rem;
    }
    
    .role-badge {
      display: inline-block;
      background: #007bff;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      margin-right: 0.5rem;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    
    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #007bff;
      margin: 0.5rem 0;
    }
    
    .actions-section {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .action-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-admin {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-outline {
      background-color: transparent;
      color: #007bff;
      border: 2px solid #007bff;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .alert {
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    
    .alert-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: UserInfo | null = null;
  crediti: number | null = null;
  prestitiAttivi: any[] = [];
  tessere: any[] = [];
  error = '';
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Controlla se l'utente è loggato
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Sottoscrivi ai dati utente
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = this.authService.isAdmin();
    });

    this.loadUserData();
  }

  loadUserData(): void {
    this.error = '';
    
    // Carica crediti
    this.apiService.getUserCredits().subscribe({
      next: (crediti) => {
        this.crediti = crediti;
      },
      error: (error) => {
        console.error('Errore caricamento crediti:', error);
      }
    });

    // Carica tessere
    this.apiService.getUserTessere().subscribe({
      next: (tessere) => {
        this.tessere = tessere;
      },
      error: (error) => {
        console.error('Errore caricamento tessere:', error);
      }
    });

    // Carica prestiti
    this.apiService.getUserPrestiti().subscribe({
      next: (prestiti) => {
        this.prestitiAttivi = prestiti;
      },
      error: (error) => {
        console.error('Errore caricamento prestiti:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}