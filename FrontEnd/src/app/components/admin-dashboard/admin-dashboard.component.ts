// src/app/components/admin-dashboard/admin-dashboard.component.ts - DESIGN MINIMALE
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, TesseraLibreria, TipologiaTessera, Utente } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Admin Dashboard</h1>
        <button (click)="logout()">Logout</button>
      </div>

      @if (loading) {
        <p>Caricamento...</p>
      } @else {
        <!-- Stats -->
        <div class="stats">
          <span>Tessere: {{ allTessere.length }}</span>
          <span>Richieste: {{ richiesteInAttesa.length }}</span>
          <span>Utenti: {{ utenti.length }}</span>
        </div>

        <!-- Richieste -->
        @if (richiesteInAttesa.length > 0) {
          <div class="section">
            <h2>Richieste in Attesa</h2>
            
            @for (richiesta of richiesteInAttesa; track richiesta.id) {
              <div class="item">
                <div>
                  <strong>{{ richiesta.utente.nome }} {{ richiesta.utente.cognome }}</strong>
                  <br>{{ richiesta.tipologia.nome }}
                  <br>{{ richiesta.utente.email }}
                </div>
                
                <div>
                  <button 
                    (click)="approvaTessera(richiesta)" 
                    [disabled]="processing === richiesta.id">
                    @if (processing === richiesta.id && action === 'approve') {
                      Approvando...
                    } @else {
                      Approva
                    }
                  </button>
                  
                  <button 
                    (click)="rifiutaTessera(richiesta)" 
                    [disabled]="processing === richiesta.id">
                    @if (processing === richiesta.id && action === 'reject') {
                      Rifiutando...
                    } @else {
                      Rifiuta
                    }
                  </button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Tessere -->
        <div class="section">
          <h2>Tessere</h2>
          
          <!-- Filtri -->
          <div class="filters">
            <select [(ngModel)]="filtroStato" (change)="applyFilters()">
              <option value="">Tutti</option>
              <option value="ATTIVA">Attive</option>
              <option value="SOSPESA">Disabilitate</option>
              <option value="RICHIESTA_PENDING">In Attesa</option>
              <option value="SCADUTA">Scadute</option>
            </select>
            
            <input 
              [(ngModel)]="filtroUtente" 
              (input)="applyFilters()"
              placeholder="Cerca utente">
            
            <button (click)="loadData()">Ricarica</button>
          </div>

          @for (tessera of tessereFiltered; track tessera.id) {
            <div class="item">
              <div>
                <strong>{{ tessera.utente.nome }} {{ tessera.utente.cognome }}</strong>
                <br>{{ tessera.tipologia.nome }}
                <br>{{ tessera.utente.email }}
                @if (tessera.numeroTessera) {
                  <br><code>{{ tessera.numeroTessera }}</code>
                }
              </div>
              
              <div>
                <span class="status-{{ tessera.stato.toLowerCase() }}">
                  {{ getStatoDisplay(tessera.stato) }}
                </span>
                @if (tessera.stato === 'ATTIVA') {
                  <br>{{ tessera.creditiRimanenti }}/{{ tessera.tipologia.creditiMensili }} crediti
                }
                @if (tessera.dataScadenza) {
                  <br>Scade: {{ formatDate(tessera.dataScadenza) }}
                }
              </div>

              <div>
                @if (tessera.stato === 'ATTIVA') {
                  <button (click)="sospendTessera(tessera)">
                    Disabilita
                  </button>
                } @else {
                  <span>-</span>
                }
              </div>
            </div>
          }
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

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    .filters {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }

    .filters select, .filters input {
      padding: 6px;
      border: 1px solid #ccc;
    }

    .filters input {
      flex: 1;
      min-width: 200px;
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

    .item > div:last-child {
      text-align: right;
      flex: 0;
    }

    .status-attiva { 
      background: #d4f4dd; 
      padding: 3px 6px; 
      border-radius: 3px;
    }

    .status-sospesa { 
      background: #f0f0f0; 
      padding: 3px 6px; 
      border-radius: 3px;
    }

    .status-richiesta_pending { 
      background: #fff3cd; 
      padding: 3px 6px; 
      border-radius: 3px;
    }

    .status-scaduta { 
      background: #f8d7da; 
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

    code {
      background: #f1f1f1;
      padding: 2px 4px;
      font-family: monospace;
    }

    @media (max-width: 600px) {
      .item {
        flex-direction: column;
        align-items: stretch;
      }

      .item > div {
        padding: 5px 0;
      }

      .item > div:last-child {
        text-align: left;
      }

      .filters {
        flex-direction: column;
      }

      .stats {
        flex-direction: column;
        gap: 10px;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  allTessere: TesseraLibreria[] = [];
  tessereFiltered: TesseraLibreria[] = [];
  tipologie: TipologiaTessera[] = [];
  utenti: Utente[] = [];
  richiesteInAttesa: TesseraLibreria[] = [];

  loading = true;
  error = '';
  filtroStato = '';
  filtroUtente = '';
  processing: number | null = null;
  action: 'approve' | 'reject' | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/home']);
      return;
    }
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getAllTessere().subscribe({
      next: (tessere) => {
        this.allTessere = tessere;
        this.richiesteInAttesa = tessere.filter(t => t.stato === 'RICHIESTA_PENDING');
        this.applyFilters();
      },
      error: () => this.error = 'Errore caricamento tessere'
    });

    this.apiService.getAllUsers().subscribe({
      next: (utenti) => this.utenti = utenti,
      error: () => console.error('Errore caricamento utenti')
    });

    this.apiService.getAllTipologie().subscribe({
      next: (tipologie) => {
        this.tipologie = tipologie;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error('Errore caricamento tipologie');
      }
    });
  }

  applyFilters(): void {
    this.tessereFiltered = this.allTessere.filter(tessera => {
      const matchStato = !this.filtroStato || tessera.stato === this.filtroStato;
      const matchUtente = !this.filtroUtente || 
        tessera.utente.nome.toLowerCase().includes(this.filtroUtente.toLowerCase()) ||
        tessera.utente.cognome.toLowerCase().includes(this.filtroUtente.toLowerCase()) ||
        tessera.utente.email.toLowerCase().includes(this.filtroUtente.toLowerCase());
      
      return matchStato && matchUtente;
    });
  }

  approvaTessera(richiesta: TesseraLibreria): void {
    const note = prompt('Note approvazione (opzionale):', '') || '';
    
    this.processing = richiesta.id;
    this.action = 'approve';
    
    this.apiService.approvaTessera(richiesta.id, note).subscribe({
      next: () => {
        this.richiesteInAttesa = this.richiesteInAttesa.filter(r => r.id !== richiesta.id);
        this.loadData();
        alert(`Tessera approvata per ${richiesta.utente.nome} ${richiesta.utente.cognome}`);
        this.processing = null;
        this.action = null;
      },
      error: (error) => {
        alert(`Errore: ${error.error || 'Errore durante l\'approvazione'}`);
        this.processing = null;
        this.action = null;
      }
    });
  }

  rifiutaTessera(richiesta: TesseraLibreria): void {
    const motivo = prompt('Motivo del rifiuto (richiesto):', '');
    
    if (!motivo?.trim()) {
      alert('Il motivo del rifiuto è obbligatorio');
      return;
    }
    
    this.processing = richiesta.id;
    this.action = 'reject';
    
    this.apiService.rifiutaTessera(richiesta.id, motivo).subscribe({
      next: () => {
        this.richiesteInAttesa = this.richiesteInAttesa.filter(r => r.id !== richiesta.id);
        this.loadData();
        alert(`Richiesta rifiutata per ${richiesta.utente.nome} ${richiesta.utente.cognome}`);
        this.processing = null;
        this.action = null;
      },
      error: (error) => {
        alert(`Errore: ${error.error || 'Errore durante il rifiuto'}`);
        this.processing = null;
        this.action = null;
      }
    });
  }

  sospendTessera(tessera: TesseraLibreria): void {
    const conferma = confirm(`Disabilitare la tessera di ${tessera.utente.nome} ${tessera.utente.cognome}?`);
    
    if (!conferma) return;
    
    const motivo = prompt('Motivo:', '') || 'Disabilitata dall\'amministratore';
    
    this.apiService.sospendiTessera(tessera.id, motivo).subscribe({
      next: () => {
        this.loadData();
        alert(`Tessera disabilitata per ${tessera.utente.nome} ${tessera.utente.cognome}`);
      },
      error: (error) => {
        alert(`Errore: ${error.error || 'Errore durante la disabilitazione'}`);
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

  getStatoDisplay(stato: string): string {
    const statiMap: { [key: string]: string } = {
      'ATTIVA': 'Attiva',
      'SOSPESA': 'Disabilitata',
      'SCADUTA': 'Scaduta',
      'RICHIESTA_PENDING': 'In Attesa',
      'RICHIESTA_RIFIUTATA': 'Rifiutata'
    };
    return statiMap[stato] || stato;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}