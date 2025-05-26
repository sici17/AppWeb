// src/app/components/dashboard/dashboard.component.ts - VERSIONE CORRETTA COMPLETA
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserInfo } from '../../services/auth.service';
import { ApiService, TesseraLibreria, Prestito } from '../../services/api.service';

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
            <span>Benvenuto, {{ currentUser.given_name || currentUser.preferred_username }}!</span>
            <button (click)="logout()" class="btn btn-outline">Logout</button>
          }
        </div>
      </header>

      @if (loading) {
        <div class="loading">Caricamento dati...</div>
      }

      @if (currentUser && !loading) {
        <div class="dashboard-content">
          <!-- Informazioni utente base -->
          <div class="user-card">
            <h2>I tuoi dati</h2>
            <p><strong>Nome:</strong> {{ currentUser.given_name }} {{ currentUser.family_name }}</p>
            <p><strong>Email:</strong> {{ currentUser.email }}</p>
            <p><strong>Username:</strong> {{ currentUser.preferred_username }}</p>
          </div>

          <!-- Statistiche reali -->
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Crediti Disponibili</h3>
              @if (crediti !== null) {
                <p class="stat-number">{{ crediti }}</p>
                <p class="stat-label">crediti rimanenti</p>
              } @else {
                <p class="stat-loading">Caricamento...</p>
              }
            </div>

            <div class="stat-card">
              <h3>Prestiti Attivi</h3>
              <p class="stat-number">{{ prestitiAttivi.length }}</p>
              <p class="stat-label">prestiti in corso</p>
            </div>

            <div class="stat-card">
              <h3>Tessere Attive</h3>
              <p class="stat-number">{{ tessereAttive.length }}</p>
              <p class="stat-label">tessere disponibili</p>
            </div>
          </div>

          <!-- Dettagli Tessere -->
          @if (tessereAttive.length > 0) {
            <div class="details-section">
              <h2>Le tue Tessere</h2>
              <div class="tessere-list">
                @for (tessera of tessereAttive; track tessera.id) {
                  <div class="tessera-card">
                    <h4>{{ tessera.tipologia.nome }}</h4>
                    <p><strong>Numero:</strong> {{ tessera.numeroTessera }}</p>
                    <p><strong>Crediti:</strong> {{ tessera.creditiRimanenti }}/{{ tessera.tipologia.creditiMensili }}</p>
                    <p><strong>Scadenza:</strong> {{ formatDate(tessera.dataScadenza) }}</p>
                    <span class="status" [class]="'status-' + tessera.stato.toLowerCase()">
                      {{ tessera.stato }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Dettagli Prestiti -->
          @if (prestitiAttivi.length > 0) {
            <div class="details-section">
              <h2>I tuoi Prestiti Attivi</h2>
              <div class="prestiti-list">
                @for (prestito of prestitiAttivi; track prestito.id) {
                  <div class="prestito-card">
                    <h4>{{ prestito.risorsa.titolo }}</h4>
                    <p><strong>Autore:</strong> {{ prestito.risorsa.autore }}</p>
                    <p><strong>Tipo:</strong> {{ prestito.risorsa.tipo }}</p>
                    <p><strong>Data inizio:</strong> {{ formatDate(prestito.dataInizio) }}</p>
                    <p><strong>Scadenza:</strong> {{ formatDate(prestito.dataScadenza) }}</p>
                    <span class="status" [class]="'status-' + prestito.stato.toLowerCase()">
                      {{ prestito.stato }}
                    </span>
                    @if (prestito.multa > 0) {
                      <p class="multa"><strong>Multa:</strong> €{{ prestito.multa }}</p>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Sezione azioni -->
          <div class="actions-section">
            <h2>Azioni Rapide</h2>
            <div class="action-buttons">
              <button (click)="navigateTo('/risorse')" class="btn btn-primary">
                📚 Sfoglia Catalogo
              </button>
              <button (click)="navigateTo('/tessere')" class="btn btn-secondary">
                🎫 Gestisci Tessere
              </button>
              <button (click)="loadUserData()" class="btn btn-secondary">
                🔄 Ricarica Dati
              </button>
              @if (isAdmin) {
                <button (click)="navigateTo('/admin-dashboard')" class="btn btn-admin">
                  👑 Pannello Admin
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
      background-color: #f8f9fa;
      min-height: 100vh;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #dee2e6;
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    h1 {
      color: #495057;
      margin: 0;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info span {
      font-weight: 600;
      color: #495057;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      font-size: 18px;
      color: #6c757d;
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

    .user-card h2 {
      margin-top: 0;
      color: #495057;
    }

    .user-card p {
      margin: 0.5rem 0;
      color: #6c757d;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      text-align: center;
      border-top: 4px solid #007bff;
    }

    .stat-card h3 {
      margin: 0 0 1rem 0;
      color: #495057;
      font-size: 1.1rem;
    }
    
    .stat-number {
      font-size: 2.5rem;
      font-weight: bold;
      color: #007bff;
      margin: 0.5rem 0;
    }

    .stat-label {
      color: #6c757d;
      font-size: 0.9rem;
      margin: 0;
    }

    .stat-loading {
      color: #6c757d;
      font-style: italic;
    }

    .details-section {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .details-section h2 {
      margin-top: 0;
      color: #495057;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 0.5rem;
    }

    .tessere-list, .prestiti-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .tessera-card, .prestito-card {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 1rem;
      position: relative;
    }

    .tessera-card h4, .prestito-card h4 {
      margin: 0 0 0.5rem 0;
      color: #495057;
    }

    .tessera-card p, .prestito-card p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
      color: #6c757d;
    }

    .status {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-attiva, .status-attivo {
      background-color: #d4edda;
      color: #155724;
    }

    .status-scaduta, .status-scaduto {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-sospesa {
      background-color: #fff3cd;
      color: #856404;
    }

    .multa {
      color: #dc3545 !important;
      font-weight: 600;
    }
    
    .actions-section {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .actions-section h2 {
      margin-top: 0;
      color: #495057;
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
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
      transform: translateY(-1px);
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
      transform: translateY(-1px);
    }
    
    .btn-admin {
      background-color: #dc3545;
      color: white;
    }

    .btn-admin:hover {
      background-color: #c82333;
      transform: translateY(-1px);
    }
    
    .btn-outline {
      background-color: transparent;
      color: #007bff;
      border: 2px solid #007bff;
    }

    .btn-outline:hover {
      background-color: #007bff;
      color: white;
    }
    
    .alert {
      padding: 1rem;
      border-radius: 6px;
      margin-top: 1rem;
    }
    
    .alert-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .action-buttons {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: UserInfo | null = null;
  crediti: number | null = null;
  prestitiAttivi: Prestito[] = [];
  tessereAttive: TesseraLibreria[] = [];
  error = '';
  loading = true;
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = this.authService.isAdmin();
    });

    this.loadUserData();
  }

  loadUserData(): void {
    this.loading = true;
    this.error = '';
    
    // Carica crediti
    this.apiService.getUserCredits().subscribe({
      next: (crediti) => {
        this.crediti = crediti;
        console.log('Crediti caricati:', crediti);
      },
      error: (error) => {
        console.error('Errore caricamento crediti:', error);
        this.crediti = 0;
      }
    });

    // Carica tessere attive
    this.apiService.getUserTessere().subscribe({
      next: (tessere) => {
        this.tessereAttive = tessere.filter(t => t.stato === 'ATTIVA');
        console.log('Tessere caricate:', tessere);
      },
      error: (error) => {
        console.error('Errore caricamento tessere:', error);
        this.tessereAttive = [];
      }
    });

    // Carica prestiti futuri/attivi
    this.apiService.getUserPrestitiFuturi().subscribe({
      next: (prestiti) => {
        this.prestitiAttivi = prestiti.filter(p => p.stato === 'ATTIVO');
        console.log('Prestiti caricati:', prestiti);
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore caricamento prestiti:', error);
        this.prestitiAttivi = [];
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}