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
    <div class="container">
      <div class="header">
        <h1>Dashboard</h1>
        <div>
          @if (currentUser) {
            <span>{{ currentUser.given_name || currentUser.preferred_username }}</span>
            <button (click)="logout()">Logout</button>
          }
        </div>
      </div>

      @if (loading) {
        <p>Caricamento...</p>
      } @else {
        <!-- Info Utente -->
        @if (currentUser) {
          <div class="section">
            <h2>I tuoi dati</h2>
            <div class="info">
              <p><strong>Nome:</strong> {{ currentUser.given_name }} {{ currentUser.family_name }}</p>
              <p><strong>Email:</strong> {{ currentUser.email }}</p>
              <p><strong>Username:</strong> {{ currentUser.preferred_username }}</p>
            </div>
          </div>
        }

        <!-- Statistiche -->
        <div class="stats">
          <span>Crediti: {{ crediti !== null ? crediti : '...' }}</span>
          <span>Prestiti attivi: {{ prestitiAttivi.length }}</span>
          <span>Tessere: {{ tessereAttive.length }}</span>
        </div>

        <!-- Tessere Attive -->
        @if (tessereAttive.length > 0) {
          <div class="section">
            <h2>Le tue Tessere</h2>
            @for (tessera of tessereAttive; track tessera.id) {
              <div class="item">
                <div>
                  <strong>{{ tessera.tipologia.nome }}</strong>
                  <br>Numero: {{ tessera.numeroTessera }}
                  <br>Scadenza: {{ formatDate(tessera.dataScadenza) }}
                </div>
                <div>
                  <span class="status-{{ tessera.stato.toLowerCase() }}">
                    {{ tessera.stato }}
                  </span>
                  <br>{{ tessera.creditiRimanenti }}/{{ tessera.tipologia.creditiMensili }} crediti
                </div>
              </div>
            }
          </div>
        }

        <!-- Prestiti Attivi -->
        @if (prestitiAttivi.length > 0) {
          <div class="section">
            <h2>I tuoi Prestiti</h2>
            @for (prestito of prestitiAttivi; track prestito.id) {
              <div class="item">
                <div>
                  <strong>{{ prestito.risorsa.titolo }}</strong>
                  <br>Autore: {{ prestito.risorsa.autore }}
                  <br>Tipo: {{ prestito.risorsa.tipo }}
                </div>
                <div>
                  <span class="status-{{ prestito.stato.toLowerCase() }}">
                    {{ prestito.stato }}
                  </span>
                  <br>Inizio: {{ formatDate(prestito.dataInizio) }}
                  <br>Scadenza: {{ formatDate(prestito.dataScadenza) }}
                  @if (prestito.multa > 0) {
                    <br><strong>Multa: €{{ prestito.multa }}</strong>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Azioni -->
        <div class="section">
          <h2>Azioni</h2>
          <div class="actions">
            <button (click)="navigateTo('/risorse')">Catalogo</button>
            <button (click)="navigateTo('/tessere')">Gestisci Tessere</button>
            <button (click)="loadUserData()">Ricarica Dati</button>
            @if (isAdmin) {
              <button (click)="navigateTo('/admin-dashboard')">Admin</button>
            }
          </div>
        </div>
      }

      @if (error) {
        <div class="error">{{ error }}</div>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ccc;
    }

    .header div {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    h1 {
      margin: 0;
      font-size: 24px;
    }

    h2 {
      font-size: 18px;
      margin: 20px 0 10px 0;
    }

    button {
      padding: 8px 12px;
      margin: 2px;
      border: 1px solid #ccc;
      background: white;
      cursor: pointer;
    }

    button:hover {
      background: #f0f0f0;
    }

    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      padding: 15px;
      background: #f8f8f8;
      border: 1px solid #ddd;
    }

    .stats span {
      font-weight: bold;
    }

    .section {
      margin-bottom: 30px;
    }

    .info {
      padding: 15px;
      background: #f8f8f8;
      border: 1px solid #ddd;
    }

    .info p {
      margin: 5px 0;
    }

    .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      margin-bottom: 5px;
      border: 1px solid #ddd;
      background: white;
    }

    .item > div {
      flex: 1;
      padding: 0 10px;
    }

    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .status-attiva, .status-attivo { 
      background: #d4f4dd; 
      padding: 3px 6px; 
      border-radius: 3px;
    }

    .status-scaduta, .status-scaduto { 
      background: #f8d7da; 
      padding: 3px 6px; 
      border-radius: 3px;
    }

    .status-sospesa { 
      background: #fff3cd; 
      padding: 3px 6px; 
      border-radius: 3px;
    }

    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 10px;
      border: 1px solid #f5c6cb;
      margin: 10px 0;
    }

    @media (max-width: 600px) {
      .header {
        flex-direction: column;
        gap: 10px;
        text-align: center;
      }

      .item {
        flex-direction: column;
        align-items: stretch;
      }

      .item > div {
        padding: 5px 0;
      }

      .actions {
        flex-direction: column;
      }

      .stats {
        flex-direction: column;
        gap: 10px;
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
      next: (crediti) => this.crediti = crediti,
      error: () => this.crediti = 0
    });

    // Carica tessere attive
    this.apiService.getUserTessere().subscribe({
      next: (tessere) => {
        this.tessereAttive = tessere.filter(t => t.stato === 'ATTIVA');
      },
      error: () => this.tessereAttive = []
    });

    // Carica prestiti attivi
    this.apiService.getUserPrestitiFuturi().subscribe({
      next: (prestiti) => {
        this.prestitiAttivi = prestiti.filter(p => p.stato === 'ATTIVO');
        this.loading = false;
      },
      error: () => {
        this.prestitiAttivi = [];
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch {
      return 'N/A';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}