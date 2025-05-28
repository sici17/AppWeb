// src/app/components/admin-dashboard/admin-dashboard.component.ts - VERSIONE CORRETTA
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
              <h3>Richieste in Attesa</h3>
              <p class="stat-number">{{ richiesteInAttesa.length }}</p>
              <p class="stat-label">da approvare</p>
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

        <!-- Richieste Tessere in Attesa -->
        @if (richiesteInAttesa.length > 0) {
          <div class="richieste-section">
            <h2>📋 Richieste Tessere in Attesa ({{ richiesteInAttesa.length }})</h2>
            
            <div class="richieste-table">
              <div class="table-header">
                <div class="col">Utente</div>
                <div class="col">Tipologia</div>
                <div class="col">Data Richiesta</div>
                <div class="col">Note</div>
                <div class="col">Azioni</div>
              </div>
              
              @for (richiesta of richiesteInAttesa; track richiesta.id) {
                <div class="table-row richiesta-row">
                  <div class="col">
                    <strong>{{ richiesta.utente.nome }} {{ richiesta.utente.cognome }}</strong>
                    <small>{{ richiesta.utente.email }}</small>
                    <span class="user-type">{{ richiesta.utente.tipoUtente }}</span>
                  </div>
                  <div class="col">
                    <span class="tipologia-badge">{{ richiesta.tipologia.nome }}</span>
                    <small>{{ richiesta.tipologia.creditiMensili }} crediti/mese</small>
                    @if (richiesta.tipologia.costoAnnuale > 0) {
                      <small>€{{ richiesta.tipologia.costoAnnuale }}/anno</small>
                    } @else {
                      <small>Gratuita</small>
                    }
                  </div>
                  <div class="col">
                    @if (richiesta.dataRichiesta) {
                      {{ formatDate(richiesta.dataRichiesta) }}
                      <small>{{ getTimeAgo(richiesta.dataRichiesta) }}</small>
                    } @else {
                      <span class="no-date">Data non disponibile</span>
                    }
                  </div>
                  <div class="col">
                    @if (richiesta.noteRichiesta) {
                      <span class="note-preview">{{ richiesta.noteRichiesta }}</span>
                    } @else {
                      <span class="no-notes">Nessuna nota</span>
                    }
                  </div>
                  <div class="col actions">
                    <button (click)="approvaTessera(richiesta)" 
                            class="btn btn-success btn-sm"
                            [disabled]="processingRequest === richiesta.id">
                      @if (processingRequest === richiesta.id && actionType === 'approve') {
                        <span class="spinner"></span> Approvando...
                      } @else {
                        ✅ Approva
                      }
                    </button>
                    
                    <button (click)="rifiutaTessera(richiesta)" 
                            class="btn btn-danger btn-sm"
                            [disabled]="processingRequest === richiesta.id">
                      @if (processingRequest === richiesta.id && actionType === 'reject') {
                        <span class="spinner"></span> Rifiutando...
                      } @else {
                        ❌ Rifiuta
                      }
                    </button>
                    
                    <button (click)="viewRichiestaDetails(richiesta)" 
                            class="btn btn-info btn-sm">
                      👁️ Dettagli
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

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
              <option value="RICHIESTA_PENDING">Richieste in Attesa</option>
              <option value="RICHIESTA_RIFIUTATA">Richieste Rifiutate</option>
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
                  @if (tessera.numeroTessera) {
                    <code>{{ tessera.numeroTessera }}</code>
                  } @else {
                    <span class="no-number">In attesa</span>
                  }
                </div>
                <div class="col">
                  <span class="status-badge" [class]="'status-' + tessera.stato.toLowerCase()">
                    {{ getStatoDisplay(tessera.stato) }}
                  </span>
                </div>
                <div class="col">
                  @if (tessera.stato === 'ATTIVA') {
                    <strong>{{ tessera.creditiRimanenti }}</strong>
                    <small>/{{ tessera.tipologia.creditiMensili }}</small>
                  } @else {
                    <span class="no-credits">-</span>
                  }
                </div>
                <div class="col">
                  @if (tessera.dataScadenza) {
                    {{ formatDate(tessera.dataScadenza) }}
                    @if (isScadente(tessera)) {
                      <span class="warning">⚠️</span>
                    }
                  } @else {
                    <span class="no-date">Non assegnata</span>
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
                  
                  <button (click)="viewDetails(tessera)" class="btn btn-info btn-sm">
                    👁️ Dettagli
                  </button>
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

      <!-- Modal Dettagli -->
      @if (showDetailsModal && (selectedTessera || selectedRichiesta)) {
        <div class="modal-backdrop" (click)="closeDetailsModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            @if (selectedRichiesta) {
              <!-- Dettagli Richiesta -->
              <h3>📋 Dettagli Richiesta Tessera</h3>
              <div class="modal-body">
                <div class="detail-section">
                  <h4>👤 Informazioni Utente</h4>
                  <p><strong>Nome:</strong> {{ selectedRichiesta.utente.nome }} {{ selectedRichiesta.utente.cognome }}</p>
                  <p><strong>Email:</strong> {{ selectedRichiesta.utente.email }}</p>
                  <p><strong>Tipo:</strong> {{ selectedRichiesta.utente.tipoUtente }}</p>
                </div>
                
                <div class="detail-section">
                  <h4>🎫 Tipologia Richiesta</h4>
                  <p><strong>Nome:</strong> {{ selectedRichiesta.tipologia.nome }}</p>
                  <p><strong>Crediti mensili:</strong> {{ selectedRichiesta.tipologia.creditiMensili }}</p>
                  <p><strong>Durata prestito:</strong> {{ selectedRichiesta.tipologia.durataPrestitoGiorni }} giorni</p>
                  <p><strong>Costo:</strong> 
                    @if (selectedRichiesta.tipologia.costoAnnuale > 0) {
                      €{{ selectedRichiesta.tipologia.costoAnnuale }}/anno
                    } @else {
                      Gratuita
                    }
                  </p>
                </div>
                
                <div class="detail-section">
                  <h4>📅 Informazioni Richiesta</h4>
                  @if (selectedRichiesta.dataRichiesta) {
                    <p><strong>Data richiesta:</strong> {{ formatDate(selectedRichiesta.dataRichiesta) }}</p>
                  }
                  <p><strong>Stato:</strong> 
                    <span class="status-badge" [class]="'status-' + selectedRichiesta.stato.toLowerCase()">
                      {{ getStatoDisplay(selectedRichiesta.stato) }}
                    </span>
                  </p>
                  @if (selectedRichiesta.noteRichiesta) {
                    <p><strong>Note utente:</strong> {{ selectedRichiesta.noteRichiesta }}</p>
                  }
                </div>
              </div>
              
              <div class="modal-actions">
                @if (selectedRichiesta.stato === 'RICHIESTA_PENDING') {
                  <button (click)="approvaTesseraFromModal()" 
                          class="btn btn-success"
                          [disabled]="processingRequest === selectedRichiesta.id">
                    @if (processingRequest === selectedRichiesta.id && actionType === 'approve') {
                      <span class="spinner"></span> Approvando...
                    } @else {
                      ✅ Approva Richiesta
                    }
                  </button>
                  
                  <button (click)="rifiutaTesseraFromModal()" 
                          class="btn btn-danger"
                          [disabled]="processingRequest === selectedRichiesta.id">
                    @if (processingRequest === selectedRichiesta.id && actionType === 'reject') {
                      <span class="spinner"></span> Rifiutando...
                    } @else {
                      ❌ Rifiuta Richiesta
                    }
                  </button>
                }
                
                <button (click)="closeDetailsModal()" class="btn btn-secondary">
                  Chiudi
                </button>
              </div>
            } @else if (selectedTessera) {
              <!-- Dettagli Tessera Esistente -->
              <h3>🎫 Dettagli Tessera</h3>
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
                  <p><strong>Stato:</strong> {{ getStatoDisplay(selectedTessera.stato) }}</p>
                  @if (selectedTessera.dataEmissione) {
                    <p><strong>Emissione:</strong> {{ formatDate(selectedTessera.dataEmissione) }}</p>
                  }
                  @if (selectedTessera.dataScadenza) {
                    <p><strong>Scadenza:</strong> {{ formatDate(selectedTessera.dataScadenza) }}</p>
                  }
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
            }
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

    .stats-section, .tessere-section, .tipologie-section, .richieste-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stats-section h2, .tessere-section h2, .tipologie-section h2, .richieste-section h2 {
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

    .stat-label {
      font-size: 0.8rem;
      opacity: 0.8;
      margin: 0.5rem 0 0 0;
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

    .tessere-table, .richieste-table {
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

    .table-row.status-richiesta_pending {
      background-color: #fff3cd;
    }

    .table-row.status-richiesta_rifiutata {
      background-color: #f8d7da;
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

    .user-type {
      background: #bee3f8;
      color: #1a365d;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 0.5rem;
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

    .status-badge.status-richiesta_pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.status-richiesta_rifiutata {
      background: #fed7d7;
      color: #742a2a;
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
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .btn-sm {
      padding: 0.25rem 0.75rem;
      font-size: 0.8rem;
    }

    .btn-primary { background: #4299e1; color: white; }
    .btn-secondary { background: #a0aec0; color: white; }
    .btn-success { background: #48bb78; color: white; }
    .btn-warning { background: #ed8936; color: white; }
    .btn-danger { background: #f56565; color: white; }
    .btn-info { background: #0bc5ea; color: white; }
    .btn-outline { background: transparent; color: #4299e1; border: 2px solid #4299e1; }

    .btn:hover:not(:disabled) {
      opacity: 0.8;
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
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

    .no-date, .no-number, .no-credits, .no-notes {
      color: #9ca3af;
      font-style: italic;
    }

    .note-preview {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
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

    .spinner {
      width: 12px;
      height: 12px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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
  richiesteInAttesa: TesseraLibreria[] = [];

  // Stato
  loading = true;
  error = '';

  // Filtri
  filtroStato = '';
  filtroUtente = '';

  // Modal
  showDetailsModal = false;
  selectedTessera: TesseraLibreria | null = null;
  selectedRichiesta: TesseraLibreria | null = null;

  // Stato per operazioni
  processingRequest: number | null = null;
  actionType: 'approve' | 'reject' | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🔍 === DEBUG ADMIN ACCESS ===');
    console.log('🔐 IsLoggedIn:', this.authService.isLoggedIn());
    console.log('👑 IsAdmin:', this.authService.isAdmin());
    
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
    let completedRequests = 0;
    const totalRequests = 4;

    const checkComplete = () => {
      completedRequests++;
      if (completedRequests === totalRequests) {
        this.loading = false;
      }
    };

    // Carica tutte le tessere
    this.apiService.getAllTessere().subscribe({
      next: (tessere) => {
        this.allTessere = tessere;
        this.tessereAttive = tessere.filter(t => t.stato === 'ATTIVA');
        this.richiesteInAttesa = tessere.filter(t => t.stato === 'RICHIESTA_PENDING');
        this.applyFilters();
        console.log('✅ Tessere caricate:', tessere.length);
        console.log('📋 Richieste in attesa:', this.richiesteInAttesa.length);
        checkComplete();
      },
      error: (error) => {
        console.error('❌ Errore caricamento tessere:', error);
        this.error = 'Errore nel caricamento delle tessere';
        checkComplete();
      }
    });

    // Carica tipologie
    this.apiService.getAllTipologie().subscribe({
      next: (tipologie) => {
        this.tipologie = tipologie;
        console.log('✅ Tipologie caricate:', tipologie.length);
        checkComplete();
      },
      error: (error) => {
        console.error('❌ Errore caricamento tipologie:', error);
        checkComplete();
      }
    });

    // Carica utenti
    this.apiService.getAllUsers().subscribe({
      next: (utenti) => {
        this.utenti = utenti;
        console.log('✅ Utenti caricati:', utenti.length);
        checkComplete();
      },
      error: (error) => {
        console.error('❌ Errore caricamento utenti:', error);
        checkComplete();
      }
    });

    // Placeholder per completare il conteggio
    setTimeout(() => checkComplete(), 100);
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

  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT');
    } catch (error) {
      return 'Data non valida';
    }
  }

  getTimeAgo(dateString: string | undefined): string {
    if (!dateString) {
      return '';
    }
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) {
        return `${diffMins} minuti fa`;
      } else if (diffHours < 24) {
        return `${diffHours} ore fa`;
      } else {
        return `${diffDays} giorni fa`;
      }
    } catch (error) {
      return '';
    }
  }

  getStatoDisplay(stato: string): string {
    const statiMap: { [key: string]: string } = {
      'ATTIVA': 'Attiva',
      'SOSPESA': 'Sospesa',
      'SCADUTA': 'Scaduta',
      'REVOCATA': 'Revocata',
      'BLOCCATA': 'Bloccata',
      'RICHIESTA_PENDING': 'In Attesa',
      'RICHIESTA_APPROVATA': 'Approvata',
      'RICHIESTA_RIFIUTATA': 'Rifiutata'
    };
    return statiMap[stato] || stato;
  }

  isScadente(tessera: TesseraLibreria): boolean {
    if (!tessera.dataScadenza) return false;
    
    try {
      const scadenza = new Date(tessera.dataScadenza);
      const ora = new Date();
      const giorniRimasti = Math.ceil((scadenza.getTime() - ora.getTime()) / (1000 * 60 * 60 * 24));
      return giorniRimasti <= 30 && giorniRimasti > 0;
    } catch (error) {
      return false;
    }
  }

  countTessereByTipologia(tipologiaId: number): number {
    return this.tessereAttive.filter(t => t.tipologia.id === tipologiaId).length;
  }

  // === GESTIONE RICHIESTE ===
  approvaTessera(richiesta: TesseraLibreria): void {
    const note = prompt(
      `Approvi la richiesta di tessera "${richiesta.tipologia.nome}" per ${richiesta.utente.nome} ${richiesta.utente.cognome}?\n\nNote approvazione (opzionale):`, 
      'Richiesta approvata dall\'amministratore'
    );
    
    if (note !== null) {
      this.processingRequest = richiesta.id;
      this.actionType = 'approve';
      
      console.log('✅ Approvazione tessera:', richiesta.id);
      
      this.apiService.approvaTessera(richiesta.id, note).subscribe({
        next: (response) => {
          console.log('✅ Tessera approvata:', response);
          
          // Rimuovi dalla lista richieste e ricarica
          this.richiesteInAttesa = this.richiesteInAttesa.filter(r => r.id !== richiesta.id);
          this.loadData();
          
          alert(`✅ Tessera "${richiesta.tipologia.nome}" approvata per ${richiesta.utente.nome} ${richiesta.utente.cognome}!`);
          
          this.processingRequest = null;
          this.actionType = null;
        },
        error: (error) => {
          console.error('❌ Errore approvazione tessera:', error);
          
          let errorMessage = 'Errore durante l\'approvazione';
          if (error.status === 404) {
            errorMessage = 'Richiesta non trovata';
          } else if (error.status === 400) {
            errorMessage = error.error || 'La richiesta deve essere in stato PENDING';
          }
          
          alert(`❌ ${errorMessage}`);
          this.processingRequest = null;
          this.actionType = null;
        }
      });
    }
  }

  rifiutaTessera(richiesta: TesseraLibreria): void {
    const motivo = prompt(
      `Rifiuti la richiesta di tessera "${richiesta.tipologia.nome}" per ${richiesta.utente.nome} ${richiesta.utente.cognome}?\n\nMotivo del rifiuto (richiesto):`, 
      ''
    );
    
    if (motivo !== null && motivo.trim() !== '') {
      this.processingRequest = richiesta.id;
      this.actionType = 'reject';
      
      console.log('❌ Rifiuto tessera:', richiesta.id);
      
      this.apiService.rifiutaTessera(richiesta.id, motivo).subscribe({
        next: (response) => {
          console.log('❌ Tessera rifiutata:', response);
          
          // Rimuovi dalla lista richieste e ricarica
          this.richiesteInAttesa = this.richiesteInAttesa.filter(r => r.id !== richiesta.id);
          this.loadData();
          
          alert(`❌ Richiesta tessera rifiutata per ${richiesta.utente.nome} ${richiesta.utente.cognome}.\nMotivo: ${motivo}`);
          
          this.processingRequest = null;
          this.actionType = null;
        },
        error: (error) => {
          console.error('❌ Errore rifiuto tessera:', error);
          
          let errorMessage = 'Errore durante il rifiuto';
          if (error.status === 404) {
            errorMessage = 'Richiesta non trovata';
          } else if (error.status === 400) {
            errorMessage = error.error || 'La richiesta deve essere in stato PENDING';
          }
          
          alert(`❌ ${errorMessage}`);
          this.processingRequest = null;
          this.actionType = null;
        }
      });
    } else if (motivo !== null) {
      alert('⚠️ Il motivo del rifiuto è obbligatorio');
    }
  }

  // === GESTIONE TESSERE ATTIVE ===
  sospendTessera(tessera: TesseraLibreria): void {
    const motivo = prompt(
      `Motivo sospensione tessera di ${tessera.utente.nome} ${tessera.utente.cognome}:`, 
      'Sospensione amministrativa'
    );
    
    if (motivo !== null) {
      console.log('🚫 Sospensione tessera:', tessera.id);
      
      this.apiService.sospendiTessera(tessera.id, motivo).subscribe({
        next: (response) => {
          console.log('✅ Tessera sospesa:', response);
          this.loadData();
          alert(`✅ Tessera di ${tessera.utente.nome} ${tessera.utente.cognome} sospesa con successo!`);
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
    const note = prompt(
      `Note per riattivazione tessera di ${tessera.utente.nome} ${tessera.utente.cognome}:`, 
      'Riattivazione amministrativa'
    );
    
    if (note !== null) {
      console.log('✅ Riattivazione tessera:', tessera.id);
      
      this.apiService.riattivaTessera(tessera.id, note).subscribe({
        next: (response) => {
          console.log('✅ Tessera riattivata:', response);
          this.loadData();
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

  // === MODAL ===
  viewRichiestaDetails(richiesta: TesseraLibreria): void {
    this.selectedRichiesta = richiesta;
    this.selectedTessera = null;
    this.showDetailsModal = true;
  }

  viewDetails(tessera: TesseraLibreria): void {
    this.selectedTessera = tessera;
    this.selectedRichiesta = null;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTessera = null;
    this.selectedRichiesta = null;
  }

  approvaTesseraFromModal(): void {
    if (this.selectedRichiesta) {
      this.approvaTessera(this.selectedRichiesta);
    }
  }

  rifiutaTesseraFromModal(): void {
    if (this.selectedRichiesta) {
      this.rifiutaTessera(this.selectedRichiesta);
    }
  }

  // === UTILITY ===
  editTipologia(tipologia: TipologiaTessera): void {
    alert(`Modifica tipologia ${tipologia.nome} - Funzionalità in sviluppo`);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}