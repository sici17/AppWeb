// src/app/components/tessere/tessere.component.ts - VERSIONE CORRETTA
// Nel TessereComponent, sostituisci i metodi con questi corretti:

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // IMPORT CORRETTO
import { ApiService, TipologiaTessera, TesseraLibreria } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tessere',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tessere-container">
      <h2>Gestione Tessere Biblioteca</h2>

      <!-- Le mie tessere attive -->
      @if (mieTessere.length > 0) {
        <div class="my-tessere-section">
          <h3>🎫 Le tue Tessere Attive</h3>
          <div class="tessere-grid">
            @for (tessera of mieTessere; track tessera.id) {
              <div class="tessera-card active">
                <div class="tessera-header">
                  <h4>{{ tessera.tipologia.nome }}</h4>
                  <span class="status-badge" [class]="'status-' + tessera.stato.toLowerCase()">
                    {{ tessera.stato }}
                  </span>
                </div>
                
                <div class="tessera-info">
                  <p><strong>Numero:</strong> {{ tessera.numeroTessera }}</p>
                  <p><strong>Emissione:</strong> {{ formatDate(tessera.dataEmissione) }}</p>
                  <p><strong>Scadenza:</strong> {{ formatDate(tessera.dataScadenza) }}</p>
                </div>

                <div class="credits-section">
                  <div class="credits-display">
                    <span class="credits-number">{{ tessera.creditiRimanenti }}</span>
                    <span class="credits-total">/ {{ tessera.tipologia.creditiMensili }}</span>
                  </div>
                  <p class="credits-label">Crediti Disponibili</p>
                </div>

                <div class="tessera-details">
                  <p>📅 <strong>Durata prestiti:</strong> {{ tessera.tipologia.durataPrestitoGiorni }} giorni</p>
                  <p>🔄 <strong>Max rinnovi:</strong> {{ tessera.tipologia.maxRinnovi }}</p>
                  @if (tessera.tipologia.costoAnnuale > 0) {
                    <p>💰 <strong>Costo annuo:</strong> €{{ tessera.tipologia.costoAnnuale }}</p>
                  } @else {
                    <p>🆓 <strong>Tessera Gratuita</strong></p>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Sezione per ottenere nuove tessere -->
      <div class="available-tessere-section">
        <h3>🆕 Richiedi Nuova Tessera</h3>
        
        @if (isLoading) {
          <div class="loading">Caricamento tipologie tessere...</div>
        }

        @if (error) {
          <div class="error">{{ error }}</div>
        }

        <div class="tipologie-grid">
          @for (tipologia of tipologieTessere; track tipologia.id) {
            <div class="tipologia-card" [class.featured]="tipologia.nome === 'Studente'">
              <div class="tipologia-header">
                <h4>{{ tipologia.nome }}</h4>
                @if (tipologia.costoAnnuale === 0) {
                  <span class="price-badge free">GRATUITA</span>
                } @else {
                  <span class="price-badge paid">€{{ tipologia.costoAnnuale }}/anno</span>
                }
              </div>

              <div class="tipologia-features">
                <div class="feature-highlight">
                  <span class="feature-number">{{ tipologia.creditiMensili }}</span>
                  <span class="feature-label">Prestiti/Mese</span>
                </div>

                <ul class="features-list">
                  <li>📚 {{ tipologia.durataPrestitoGiorni }} giorni per prestito</li>
                  <li>🔄 {{ tipologia.maxRinnovi }} rinnovi massimi</li>
                  <li>📊 {{ tipologia.maxPrestitiContemporanei }} prestiti simultanei</li>
                  @if (tipologia.multaGiornaliera > 0) {
                    <li>⚠️ €{{ tipologia.multaGiornaliera }}/giorno multa ritardo</li>
                  }
                  @if (tipologia.rinnovoAutomatico) {
                    <li>🔄 Rinnovo automatico crediti</li>
                  }
                </ul>
              </div>

              @if (tipologia.descrizione) {
                <div class="tipologia-description">
                  <p>{{ tipologia.descrizione }}</p>
                </div>
              }
			  
			  <div class="test-section" style="margin: 20px 0; padding: 20px; background: #f0f0f0; border-radius: 8px;">
			    <h4>🧪 Test Debug</h4>
			    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
			      <button (click)="testSimple()" class="btn btn-warning">🧪 Test Semplice</button>
			      <button (click)="testDirectCall()" class="btn btn-success">🧪 Test Direct</button>
			      <button (click)="testBypassInterceptor()" class="btn btn-info">🧪 Test Bypass</button>
			    </div>
			  </div>

              <div class="tipologia-actions">
                @if (hasTesseraOfType(tipologia.id)) {
                  <button class="btn btn-disabled" disabled>
                    ✅ Già Posseduta
                  </button>
                } @else {
                  <button 
                    (click)="richiesTessera(tipologia)" 
                    class="btn btn-primary"
                    [disabled]="requestingTessera === tipologia.id">
                    @if (requestingTessera === tipologia.id) {
                      <span class="spinner"></span> Richiedendo...
                    } @else {
                      🎫 Richiedi Tessera
                    }
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Modal di conferma richiesta tessera -->
      @if (showConfirmModal && selectedTipologia) {
        <div class="modal-backdrop" (click)="closeConfirmModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>Conferma Richiesta Tessera</h3>
            
            <div class="modal-body">
              <div class="tessera-preview">
                <h4>{{ selectedTipologia.nome }}</h4>
                
                @if (selectedTipologia.costoAnnuale > 0) {
                  <div class="cost-info">
                    <p><strong>💰 Costo:</strong> €{{ selectedTipologia.costoAnnuale }} all'anno</p>
                    <p class="cost-note">Il pagamento sarà richiesto successivamente</p>
                  </div>
                } @else {
                  <div class="free-info">
                    <p>🆓 <strong>Tessera Gratuita</strong></p>
                  </div>
                }

                <div class="benefits-summary">
                  <h5>Benefici inclusi:</h5>
                  <ul>
                    <li>💳 {{ selectedTipologia.creditiMensili }} crediti prestito mensili</li>
                    <li>📅 {{ selectedTipologia.durataPrestitoGiorni }} giorni durata prestiti</li>
                    <li>📚 {{ selectedTipologia.maxPrestitiContemporanei }} prestiti simultanei</li>
                    <li>🔄 Fino a {{ selectedTipologia.maxRinnovi }} rinnovi per prestito</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button (click)="closeConfirmModal()" class="btn btn-cancel">
                Annulla
              </button>
              <button 
                (click)="confermaRichiestaTessera()" 
                class="btn btn-confirm"
                [disabled]="confirmingRequest">
                @if (confirmingRequest) {
                  <span class="spinner"></span> Confermando...
                } @else {
                  ✅ Conferma Richiesta
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Messaggi di feedback -->
      @if (feedbackMessage) {
        <div class="feedback-message" [class]="feedbackType">
          {{ feedbackMessage }}
        </div>
      }
    </div>
  `,
  styles: [`
    .tessere-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    h2 {
      text-align: center;
      color: #495057;
      margin-bottom: 2rem;
    }

    h3 {
      color: #495057;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #dee2e6;
    }

    .my-tessere-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .available-tessere-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .tessere-grid, .tipologie-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .tessera-card, .tipologia-card {
      background: #f8f9fa;
      border: 2px solid #dee2e6;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s ease;
    }

    .tessera-card.active {
      border-color: #28a745;
      background: linear-gradient(135deg, #f8fff9 0%, #f1f8ff 100%);
    }

    .tipologia-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .tipologia-card.featured {
      border-color: #007bff;
      background: linear-gradient(135deg, #f8fbff 0%, #fff8f1 100%);
      position: relative;
    }
	

    .tipologia-card.featured::before {
      content: "⭐ CONSIGLIATA";
      position: absolute;
      top: -10px;
      left: 20px;
      background: #007bff;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tessera-header, .tipologia-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .tessera-header h4, .tipologia-header h4 {
      margin: 0;
      color: #495057;
      font-size: 1.25rem;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-attiva { background-color: #d4edda; color: #155724; }
    .status-scaduta { background-color: #f8d7da; color: #721c24; }
    .status-sospesa { background-color: #fff3cd; color: #856404; }

    .price-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .price-badge.free {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
    }

    .price-badge.paid {
      background: linear-gradient(135deg, #ffc107, #fd7e14);
      color: #212529;
    }

    .tessera-info p {
      margin: 0.5rem 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .credits-section {
      text-align: center;
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      border: 2px solid #e9ecef;
    }

    .credits-display {
      font-size: 2rem;
      font-weight: bold;
      color: #007bff;
    }

    .credits-number {
      color: #28a745;
    }

    .credits-total {
      color: #6c757d;
    }

    .credits-label {
      margin: 0.5rem 0 0 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .tessera-details {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .tessera-details p {
      margin: 0.5rem 0;
      font-size: 0.85rem;
      color: #495057;
    }

    .feature-highlight {
      text-align: center;
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .feature-number {
      display: block;
      font-size: 2.5rem;
      font-weight: bold;
    }

    .feature-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
    }

    .features-list li {
      padding: 0.5rem 0;
      color: #495057;
      font-size: 0.9rem;
    }

    .tipologia-description {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .tipologia-description p {
      margin: 0;
      color: #6c757d;
      font-style: italic;
    }

    .tipologia-actions {
      margin-top: 1.5rem;
    }

    .btn {
      width: 100%;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
    }

    .btn-disabled {
      background-color: #6c757d;
      color: white;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .btn:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading, .error {
      text-align: center;
      padding: 2rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .loading {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .error {
      background-color: #ffebee;
      color: #c62828;
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-content h3 {
      margin: 0 0 1.5rem 0;
      text-align: center;
      color: #495057;
    }

    .tessera-preview {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .tessera-preview h4 {
      margin: 0 0 1rem 0;
      text-align: center;
      color: #495057;
    }

    .cost-info, .free-info {
      text-align: center;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }

    .cost-info {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
    }

    .free-info {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
    }

    .cost-note {
      font-size: 0.85rem;
      color: #856404;
      margin: 0.5rem 0 0 0;
    }

    .benefits-summary h5 {
      margin: 1rem 0 0.5rem 0;
      color: #495057;
    }

    .benefits-summary ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .benefits-summary li {
      margin: 0.5rem 0;
      color: #495057;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .btn-cancel {
      background-color: #6c757d;
      color: white;
      width: auto;
      padding: 0.75rem 1.5rem;
    }

    .btn-cancel:hover {
      background-color: #545b62;
    }

    .btn-confirm {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      width: auto;
      padding: 0.75rem 1.5rem;
    }

    .btn-confirm:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
    }

    .feedback-message {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1001;
      animation: slideIn 0.3s ease;
    }

    .feedback-message.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .feedback-message.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @media (max-width: 768px) {
      .tessere-container {
        padding: 1rem;
      }

      .tessere-grid, .tipologie-grid {
        grid-template-columns: 1fr;
      }

      .modal-content {
        margin: 1rem;
        width: calc(100% - 2rem);
      }

      .modal-actions {
        flex-direction: column;
      }

      .btn-cancel, .btn-confirm {
        width: 100%;
      }
    }
  `]
})
export class TessereComponent implements OnInit {
  mieTessere: TesseraLibreria[] = [];
  tipologieTessere: TipologiaTessera[] = [];
  
  isLoading = true;
  error = '';
  
  // Modal state
  showConfirmModal = false;
  selectedTipologia: TipologiaTessera | null = null;
  requestingTessera: number | null = null;
  confirmingRequest = false;
  
  // Feedback
  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient  // <-- Questo deve essere presente
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadData();
  }

  private loadData(): void {
    this.loadMieTessere();
    this.loadTipologieTessere();
  }

  private loadMieTessere(): void {
    this.apiService.getUserTessere().subscribe({
      next: (tessere) => {
        this.mieTessere = tessere.filter(t => t.stato === 'ATTIVA');
        console.log('Tessere caricate:', tessere);
      },
      error: (error) => {
        console.error('Errore caricamento tessere:', error);
      }
    });
  }

  private loadTipologieTessere(): void {
    this.isLoading = true;
    this.apiService.getAllTipologie().subscribe({
      next: (tipologie) => {
        this.tipologieTessere = tipologie.filter(t => t.attiva);
        this.isLoading = false;
        console.log('Tipologie caricate:', tipologie);
      },
      error: (error) => {
        console.error('Errore caricamento tipologie:', error);
        this.error = 'Errore nel caricamento delle tipologie tessera';
        this.isLoading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  }

  hasTesseraOfType(tipologiaId: number): boolean {
    return this.mieTessere.some(tessera => tessera.tipologia.id === tipologiaId);
  }
  


  richiesTessera(tipologia: TipologiaTessera): void {
    this.selectedTipologia = tipologia;
    this.showConfirmModal = true;
  }

  confermaRichiestaTessera(): void {
    if (!this.selectedTipologia) return;
    
    this.confirmingRequest = true;
    
    this.apiService.createTessera(this.selectedTipologia.id).subscribe({
      next: (nuovaTessera) => {
        this.showFeedback('Tessera richiesta con successo!', 'success');
        this.closeConfirmModal();
        this.loadMieTessere(); // Ricarica le tessere
        this.confirmingRequest = false;
      },
      error: (error) => {
        console.error('Errore richiesta tessera:', error);
        let errorMessage = 'Errore durante la richiesta della tessera';
        
        if (error.status === 409) {
          errorMessage = 'Hai già una tessera di questo tipo';
        } else if (error.status === 404) {
          errorMessage = 'Tipologia tessera non trovata';
        }
        
        this.showFeedback(errorMessage, 'error');
        this.confirmingRequest = false;
      }
    });
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.selectedTipologia = null;
    this.confirmingRequest = false;
  }

  private showFeedback(message: string, type: 'success' | 'error'): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
    
    setTimeout(() => {
      this.feedbackMessage = '';
    }, 5000);
  }
  // Metodi corretti:
  testDirectCall(): void {
    console.log('🧪 === TEST DIRECT CALL ===');
    
    this.apiService.testDirectCall().subscribe({
      next: (result: any) => {
        console.log('✅ Test diretto riuscito:', result);
      },
      error: (error: any) => {
        console.error('❌ Test diretto fallito:', error);
      }
    });
  }

  testBypassInterceptor(): void {
    console.log('🧪 === TEST BYPASS INTERCEPTOR ===');
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('❌ Nessun token nel localStorage');
      return;
    }
    
    console.log('🎫 Token trovato:', token.substring(0, 50) + '...');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    console.log('📤 Headers creati:', headers.keys());
    
    this.http.get('http://localhost:8081/api/utenti/crediti', { headers }).subscribe({
      next: (crediti: any) => {
        console.log('✅ Bypass interceptor riuscito:', crediti);
      },
      error: (error: any) => {
        console.error('❌ Bypass interceptor fallito:', error);
      }
    });
  }

  testSimple(): void {
    console.log('🧪 === TEST SEMPLICE ===');
    
    const token = localStorage.getItem('access_token');
    console.log('🎫 Token nel localStorage:', !!token);
    
    if (token) {
      console.log('🎫 Token (primi 50 char):', token.substring(0, 50) + '...');
    }
    
    console.log('🔐 AuthService.isLoggedIn():', this.authService.isLoggedIn());
    console.log('🔐 AuthService.getToken():', !!this.authService.getToken());
    
    console.log('📞 Chiamando getUserCredits...');
    this.apiService.getUserCredits().subscribe({
      next: (crediti: any) => {
        console.log('✅ getUserCredits riuscita:', crediti);
      },
      error: (error: any) => {
        console.error('❌ getUserCredits fallita:', error);
      }
    });
  }
}