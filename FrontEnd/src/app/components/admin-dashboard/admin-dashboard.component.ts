// src/app/components/admin-dashboard/admin-dashboard.component.ts
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
    <div class="admin-container">
      <header class="admin-header">
        <h1>🏛️ Admin Dashboard - Biblioteca</h1>
        <div class="admin-info">
          <span>Benvenuto Admin!</span>
          <button (click)="logout()" class="btn btn-outline">Logout</button>
        </div>
      </header>

      @if (loading) {
        <div class="loading">Caricamento dati...</div>
      }

      @if (!loading) {
        <!-- Statistiche -->
        <div class="stats-section">
          <h2>📊 Statistiche Generali</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Tessere Totali</h3>
              <p class="stat-number">{{ allTessere.length }}</p>
            </div>
            <div class="stat-card">
              <h3>Tessere Attive</h3>
              <p class="stat-number">{{ tessereAttive.length }}</p>
            </div>
            <div class="stat-card">
              <h3>Tipologie Disponibili</h3>
              <p class="stat-number">{{ tipologie.length }}</p>
            </div>
            <div class="stat-card">
              <h3>Utenti Totali</h3>
              <p class="stat-number">{{ utenti.length }}</p>
            </div>
          </div>
        </div>

        <!-- Gestione Tessere -->
        <div class="tessere-section">
          <h2>🎫 Gestione Tessere</h2>
          
          <!-- Filtri -->
          <div class="filters">
            <select [(ngModel)]="filtroStato" (change)="applyFilters()" class="filter-select">
              <option value="">Tutti gli stati</option>
              <option value="ATTIVA">Solo Attive</option>
              <option value="SCADUTA">Solo Scadute</option>
              <option value="SOSPESA">Solo Sospese</option>
            </select>
            
            <input 
              type="text" 
              [(ngModel)]="filtroUtente" 
              (input)="applyFilters()"
              placeholder="Cerca per nome utente..."
              class="filter-input">
            
            <button (click)="loadData()" class="btn btn-secondary">🔄 Ricarica</button>
          </div>

          <!-- Lista Tessere -->
          <div class="tessere-table">
            <div class="table-header">
              <div class="col">Utente</div>
              <div class="col">Tipologia</div>
              <div class="col">N. Tessera</div>
              <div class="col">Stato</div>
              <div class="col">Crediti</div>
              <div class="col">Scadenza</div>
              <div class="col">Azioni</div>
            </div>
            
            @for (tessera of tessereFiltered; track tessera.id) {
              <div class="table-row" [class]="'status-' + tessera.stato.toLowerCase()">
                <div class="col">
                  <strong>{{ tessera.utente.nome }} {{ tessera.utente.cognome }}</strong>
                  <small>{{ tessera.utente.email }}</small>
                </div>
                <div class="col">
                  <span class="tipologia-badge">{{ tessera.tipologia.nome }}</span>
                  <small>{{ tessera.tipologia.creditiMensili }} crediti/mese</small>
                </div>
                <div class="col">
                  <code>{{ tessera.numeroTessera }}</code>
                </div>
                <div class="col">
                  <span class="status-badge" [class]="'status-' + tessera.stato.toLowerCase()">
                    {{ tessera.stato }}
                  </span>
                </div>
                <div class="col">
                  <strong>{{ tessera.creditiRimanenti }}</strong>
                  <small>/{{ tessera.tipologia.creditiMensili }}</small>
                </div>
                <div class="col">
                  {{ formatDate(tessera.dataScadenza) }}
                  @if (isScadente(tessera)) {
                    <span class="warning">⚠️</span>
                  }
                </div>
                <div class="col actions">
                  @if (tessera.stato === 'ATTIVA') {
                    <button (click)="sospendTessera(tessera)" class="btn btn-warning btn-sm">
                      🚫 Sospendi
                    </button>
                  }
                  @if (tessera.stato === 'SOSPESA') {
                    <button (click)="riattivaTessera(tessera)" class="btn btn-success btn-sm">
                      ✅ Riattiva
                    </button>
                  }
                  
                  <!-- Menu azioni aggiuntive -->
                  @if (tessera.stato === 'ATTIVA' || tessera.stato === 'SOSPESA') {
                    <div class="dropdown" style="display: inline-block;">
                      <button class="btn btn-secondary btn-sm dropdown-toggle" (click)="toggleDropdown(tessera.id)">
                        ⚙️
                      </button>
                      @if (showDropdown === tessera.id) {
                        <div class="dropdown-menu">
                          @if (tessera.stato === 'ATTIVA') {
                            <button (click)="cambiaStato(tessera, 'BLOCCATA')" class="dropdown-item">
                              🔒 Blocca
                            </button>
                          }
                          <button (click)="cambiaStato(tessera, 'REVOCATA')" class="dropdown-item">
                            ❌ Revoca
                          </button>
                          <button (click)="viewDetails(tessera)" class="dropdown-item">
                            👁️ Dettagli
                          </button>
                        </div>
                      }
                    </div>
                  } @else {
                    <button (click)="viewDetails(tessera)" class="btn btn-info btn-sm">
                      👁️ Dettagli
                    </button>
                  }
                </div>
              </div>
            }
            
            @if (tessereFiltered.length === 0) {
              <div class="no-results">
                Nessuna tessera trovata con i filtri applicati.
              </div>
            }
          </div>
        </div>

        <!-- Gestione Tipologie -->
        <div class="tipologie-section">
          <h2>⚙️ Tipologie Tessera</h2>
          <div class="tipologie-grid">
            @for (tipologia of tipologie; track tipologia.id) {
              <div class="tipologia-card">
                <h4>{{ tipologia.nome }}</h4>
                <div class="tipologia-info">
                  <p><strong>Crediti mensili:</strong> {{ tipologia.creditiMensili }}</p>
                  <p><strong>Durata prestito:</strong> {{ tipologia.durataPrestitoGiorni }} giorni</p>
                  <p><strong>Costo annuale:</strong> 
                    @if (tipologia.costoAnnuale > 0) {
                      €{{ tipologia.costoAnnuale }}
                    } @else {
                      Gratuita
                    }
                  </p>
                  <p><strong>Tessere attive:</strong> {{ countTessereByTipologia(tipologia.id) }}</p>
                </div>
                <div class="tipologia-actions">
                  <button (click)="editTipologia(tipologia)" class="btn btn-secondary btn-sm">
                    Modifica
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Modal Dettagli Tessera -->
      @if (showDetailsModal && selectedTessera) {
        <div class="modal-backdrop" (click)="closeDetailsModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>Dettagli Tessera</h3>
            <div class="modal-body">
              <div class="detail-section">
                <h4>👤 Informazioni Utente</h4>
                <p><strong>Nome:</strong> {{ selectedTessera.utente.nome }} {{ selectedTessera.utente.cognome }}</p>
                <p><strong>Email:</strong> {{ selectedTessera.utente.email }}</p>
                <p><strong>Tipo:</strong> {{ selectedTessera.utente.tipoUtente }}</p>
              </div>
              
              <div class="detail-section">
                <h4>🎫 Informazioni Tessera</h4>
                <p><strong>Numero:</strong> {{ selectedTessera.numeroTessera }}</p>
                <p><strong>Tipologia:</strong> {{ selectedTessera.tipologia.nome }}</p>
                <p><strong>Stato:</strong> {{ selectedTessera.stato }}</p>
                <p><strong>Emissione:</strong> {{ formatDate(selectedTessera.dataEmissione) }}</p>
                <p><strong>Scadenza:</strong> {{ formatDate(selectedTessera.dataScadenza) }}</p>
              </div>
              
              <div class="detail-section">
                <h4>💳 Crediti</h4>
                <p><strong>Rimanenti:</strong> {{ selectedTessera.creditiRimanenti }}</p>
                <p><strong>Totali usati:</strong> {{ selectedTessera.creditiTotaliUsati }}</p>
                <p><strong>Limite mensile:</strong> {{ selectedTessera.tipologia.creditiMensili }}</p>
              </div>
            </div>
            
            <div class="modal-actions">
              <button (click)="closeDetailsModal()" class="btn btn-secondary">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      }

      @if (error) {
        <div class="alert alert-error">
          {{ error }}
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f7fa;
      min-height: 100vh;
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 1.5rem 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .admin-header h1 {
      margin: 0;
      color: #2d3748;
      font-size: 1.8rem;
    }

    .admin-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stats-section, .tessere-section, .tipologie-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stats-section h2, .tessere-section h2, .tipologie-section h2 {
      margin: 0 0 1.5rem 0;
      color: #2d3748;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
    }

    .stat-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      opacity: 0.9;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0;
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .filter-select, .filter-input {
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
    }

    .filter-input {
      flex: 1;
      min-width: 200px;
    }

    .tessere-table {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.2fr 1fr 1fr 1.2fr 1.5fr;
      background: #f7fafc;
      padding: 1rem;
      font-weight: 600;
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.2fr 1fr 1fr 1.2fr 1.5fr;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      align-items: center;
    }

    .table-row:hover {
      background-color: #f7fafc;
    }

    .table-row.status-scaduta {
      background-color: #fed7d7;
    }

    .table-row.status-sospesa {
      background-color: #fefcbf;
    }

    .col {
      padding: 0.5rem;
    }

    .col small {
      display: block;
      color: #718096;
      font-size: 0.85rem;
    }

    .tipologia-badge {
      background: #e6fffa;
      color: #234e52;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.status-attiva {
      background: #c6f6d5;
      color: #22543d;
    }

    .status-badge.status-scaduta {
      background: #fed7d7;
      color: #742a2a;
    }

    .status-badge.status-sospesa {
      background: #fefcbf;
      color: #744210;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .btn-sm {
      padding: 0.25rem 0.75rem;
      font-size: 0.8rem;
    }

    .btn-primary { background: #4299e1; color: white; }
    .btn-secondary { background: #a0aec0; color: white; }
    .btn-success { background: #48bb78; color: white; }
    .btn-warning { background: #ed8936; color: white; }
    .btn-info { background: #0bc5ea; color: white; }
    .btn-outline { background: transparent; color: #4299e1; border: 2px solid #4299e1; }

    .btn:hover {
      opacity: 0.8;
      transform: translateY(-1px);
    }

    .tipologie-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .tipologia-card {
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      background: #f7fafc;
    }

    .tipologia-card h4 {
      margin: 0 0 1rem 0;
      color: #2d3748;
    }

    .tipologia-info p {
      margin: 0.5rem 0;
      color: #4a5568;
    }

    .tipologia-actions {
      margin-top: 1rem;
    }

    .warning {
      color: #ed8936;
      font-size: 1.2rem;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      font-size: 1.2rem;
      color: #718096;
    }

    .no-results {
      text-align: center;
      padding: 2rem;
      color: #718096;
      font-style: italic;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .alert-error {
      background: #fed7d7;
      color: #742a2a;
      border: 1px solid #feb2b2;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-content h3 {
      margin: 0 0 1.5rem 0;
      color: #2d3748;
    }

    .detail-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f7fafc;
      border-radius: 8px;
    }

    .detail-section h4 {
      margin: 0 0 1rem 0;
      color: #4a5568;
    }

    .detail-section p {
      margin: 0.5rem 0;
      color: #2d3748;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    /* Dropdown */
    .dropdown {
      position: relative;
    }

    .dropdown-toggle::after {
      content: '';
      margin-left: 0.5rem;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
      min-width: 120px;
    }

    .dropdown-item {
      display: block;
      width: 100%;
      padding: 0.5rem 1rem;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      font-size: 0.85rem;
      color: #4a5568;
      transition: background-color 0.3s ease;
    }

    .dropdown-item:hover {
      background-color: #f7fafc;
    }

    @media (max-width: 768px) {
      .admin-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .filters {
        flex-direction: column;
      }

      .table-header, .table-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .col {
        padding: 0.25rem;
      }

      .actions {
        justify-content: center;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  // Dati
  allTessere: TesseraLibreria[] = [];
  tessereFiltered: TesseraLibreria[] = [];
  tessereAttive: TesseraLibreria[] = [];
  tipologie: TipologiaTessera[] = [];
  utenti: Utente[] = [];

  // Stato
  loading = true;
  error = '';

  // Filtri
  filtroStato = '';
  filtroUtente = '';

  // Modal
  showDetailsModal = false;
  selectedTessera: TesseraLibreria | null = null;
  
  // Dropdown
  showDropdown: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // DEBUG: Verifica permessi admin
    console.log('🔍 === DEBUG ADMIN ACCESS ===');
    console.log('🔐 IsLoggedIn:', this.authService.isLoggedIn());
    console.log('👑 IsAdmin:', this.authService.isAdmin());
    console.log('👤 IsUser:', this.authService.isUser());
    
    // 🆕 AGGIUNGI QUI IL TUO CODICE:
    this.authService.currentUser$.subscribe(currentUser => {
      console.log('👤 Current User:', currentUser);
      
      if (currentUser?.realm_access?.roles) {
        console.log('👥 Ruoli utente:', currentUser.realm_access.roles);
        console.log('👑 Ha ruolo admin:', currentUser.realm_access.roles.includes('admin'));
      }
    });
    
    if (!this.authService.isLoggedIn()) {
      console.log('❌ Utente non loggato - redirect login');
      this.router.navigate(['/login']);
      return;
    }
    
    if (!this.authService.isAdmin()) {
      console.log('❌ Utente non admin - redirect home');
      alert('⚠️ Accesso negato: Solo gli amministratori possono accedere a questa sezione');
      this.router.navigate(['/home']);
      return;
    }
    
    console.log('✅ Accesso admin autorizzato');
    this.loadData();
  }
  

  loadData(): void {
    this.loading = true;
    this.error = '';

    // Carica tutte le tessere (chiamata admin)
    this.apiService.getAllTessere().subscribe({
      next: (tessere) => {
        this.allTessere = tessere;
        this.tessereAttive = tessere.filter(t => t.stato === 'ATTIVA');
        this.applyFilters();
        console.log('Tessere caricate:', tessere.length);
      },
      error: (error) => {
        console.error('Errore caricamento tessere:', error);
        this.error = 'Errore nel caricamento delle tessere';
      }
    });

    // Carica tipologie
    this.apiService.getAllTipologie().subscribe({
      next: (tipologie) => {
        this.tipologie = tipologie;
        console.log('Tipologie caricate:', tipologie.length);
      },
      error: (error) => {
        console.error('Errore caricamento tipologie:', error);
      }
    });

    // Carica utenti
    this.apiService.getAllUsers().subscribe({
      next: (utenti) => {
        this.utenti = utenti;
        this.loading = false;
        console.log('Utenti caricati:', utenti.length);
      },
      error: (error) => {
        console.error('Errore caricamento utenti:', error);
        this.loading = false;
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  }

  isScadente(tessera: TesseraLibreria): boolean {
    const scadenza = new Date(tessera.dataScadenza);
    const ora = new Date();
    const giorniRimasti = Math.ceil((scadenza.getTime() - ora.getTime()) / (1000 * 60 * 60 * 24));
    return giorniRimasti <= 30 && giorniRimasti > 0;
  }

  countTessereByTipologia(tipologiaId: number): number {
    return this.tessereAttive.filter(t => t.tipologia.id === tipologiaId).length;
  }

  // Azioni tessere - ORA FUNZIONANTI CON REFRESH
  sospendTessera(tessera: TesseraLibreria): void {
    const motivo = prompt(`Motivo sospensione tessera di ${tessera.utente.nome} ${tessera.utente.cognome}:`, 'Sospensione amministrativa');
    
    if (motivo !== null) { // null = utente ha premuto annulla
      console.log('🚫 Sospensione tessera:', tessera.id);
      
      this.apiService.sospendiTessera(tessera.id, motivo).subscribe({
        next: (response) => {
          console.log('✅ Risposta sospensione:', response);
          
          // Verifica che lo stato sia effettivamente cambiato nel backend
          if (response.statoVerificato === 'SOSPESA') {
            console.log('✅ Stato verificato nel DB: SOSPESA');
            
            // Ricarica tutti i dati per essere sicuri
            this.loadData();
            
            // Mostra messaggio di successo
            alert(`✅ Tessera di ${tessera.utente.nome} ${tessera.utente.cognome} sospesa con successo!\nStato DB: ${response.statoVerificato}`);
          } else {
            console.error('❌ Stato non aggiornato nel DB:', response.statoVerificato);
            alert(`❌ Errore: lo stato nel DB non è stato aggiornato (${response.statoVerificato})`);
          }
        },
        error: (error) => {
          console.error('❌ Errore sospensione tessera:', error);
          
          let errorMessage = 'Errore durante la sospensione';
          if (error.status === 400) {
            errorMessage = error.error || 'La tessera deve essere attiva per essere sospesa';
          } else if (error.status === 404) {
            errorMessage = 'Tessera non trovata';
          }
          
          alert(`❌ ${errorMessage}`);
        }
      });
    }
  }

  riattivaTessera(tessera: TesseraLibreria): void {
    const note = prompt(`Note per riattivazione tessera di ${tessera.utente.nome} ${tessera.utente.cognome}:`, 'Riattivazione amministrativa');
    
    if (note !== null) { // null = utente ha premuto annulla
      console.log('✅ Riattivazione tessera:', tessera.id);
      
      this.apiService.riattivaTessera(tessera.id, note).subscribe({
        next: (response) => {
          console.log('✅ Tessera riattivata:', response);
          
          // Ricarica tutti i dati
          this.loadData();
          
          // Mostra messaggio di successo
          alert(`✅ Tessera di ${tessera.utente.nome} ${tessera.utente.cognome} riattivata con successo!`);
        },
        error: (error) => {
          console.error('❌ Errore riattivazione tessera:', error);
          
          let errorMessage = 'Errore durante la riattivazione';
          if (error.status === 400) {
            errorMessage = error.error || 'La tessera deve essere sospesa per essere riattivata';
          } else if (error.status === 404) {
            errorMessage = 'Tessera non trovata';
          }
          
          alert(`❌ ${errorMessage}`);
        }
      });
    }
  }

  // Nuovo metodo per cambiare stato generico
  cambiaStato(tessera: TesseraLibreria, nuovoStato: string): void {
    const motivo = prompt(`Motivo cambio stato a "${nuovoStato}":`, `Cambio stato amministrativo`);
    
    if (motivo !== null) {
      console.log(`🔄 Cambio stato tessera ${tessera.id} a ${nuovoStato}`);
      
      this.apiService.cambiaStatoTessera(tessera.id, nuovoStato, motivo).subscribe({
        next: (response) => {
          console.log('✅ Stato cambiato:', response);
          
          // Aggiorna localmente lo stato
          tessera.stato = nuovoStato as any;
          this.applyFilters();
          
          alert(`✅ Stato tessera cambiato a "${nuovoStato}" con successo!`);
        },
        error: (error) => {
          console.error('❌ Errore cambio stato:', error);
          alert(`❌ Errore durante il cambio stato: ${error.error || error.message}`);
        }
      });
    }
  }

  viewDetails(tessera: TesseraLibreria): void {
    this.selectedTessera = tessera;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTessera = null;
  }

  editTipologia(tipologia: TipologiaTessera): void {
    alert(`Modifica tipologia ${tipologia.nome} - Funzionalità in sviluppo`);
  }

  toggleDropdown(tesseraId: number): void {
    this.showDropdown = this.showDropdown === tesseraId ? null : tesseraId;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}