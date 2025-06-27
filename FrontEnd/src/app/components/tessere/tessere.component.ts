// src/app/components/tessere/tessere.component.ts - DESIGN MINIMALE
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, TipologiaTessera, TesseraLibreria } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tessere',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Gestione Tessere</h1>
      </div>

      <!-- Le mie tessere -->
      @if (mieTessere.length > 0) {
        <div class="section">
          <h2>Le tue Tessere</h2>
          @for (tessera of mieTessere; track tessera.id) {
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
                @if (tessera.tipologia.costoAnnuale > 0) {
                  <br>€{{ tessera.tipologia.costoAnnuale }}/anno
                } @else {
                  <br>Gratuita
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Richiedi nuova tessera -->
      <div class="section">
        <h2>Richiedi Nuova Tessera</h2>
        
        @if (isLoading) {
          <p>Caricamento tipologie...</p>
        }

        @if (error) {
          <div class="error">{{ error }}</div>
        }

        @for (tipologia of tipologieTessere; track tipologia.id) {
          <div class="item">
            <div>
              <strong>{{ tipologia.nome }}</strong>
              @if (tipologia.descrizione) {
                <br>{{ tipologia.descrizione }}
              }
              <br>{{ tipologia.creditiMensili }} prestiti/mese
            </div>
            
            <div>
              @if (tipologia.costoAnnuale === 0) {
                <span class="price-free">GRATUITA</span>
              } @else {
                <span class="price-paid">€{{ tipologia.costoAnnuale }}/anno</span>
              }
            </div>

            <div>
              @if (hasTesseraOfType(tipologia.id)) {
                <button disabled>Già posseduta</button>
              } @else {
                <button 
                  (click)="richiedeTessera(tipologia)" 
                  [disabled]="requestingTessera === tipologia.id">
                  @if (requestingTessera === tipologia.id) {
                    Richiedendo...
                  } @else {
                    Richiedi
                  }
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Modal conferma -->
      @if (showConfirmModal && selectedTipologia) {
        <div class="modal-backdrop" (click)="closeConfirmModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Conferma Richiesta</h3>
            
            <div class="modal-info">
              <p><strong>Tessera:</strong> {{ selectedTipologia.nome }}</p>
              <p><strong>Crediti mensili:</strong> {{ selectedTipologia.creditiMensili }}</p>
              @if (selectedTipologia.costoAnnuale > 0) {
                <p><strong>Costo:</strong> €{{ selectedTipologia.costoAnnuale }}/anno</p>
                <p><em>Il pagamento sarà richiesto successivamente</em></p>
              } @else {
                <p><strong>Costo:</strong> Gratuita</p>
              }
            </div>
            
            <div class="modal-actions">
              <button (click)="closeConfirmModal()">Annulla</button>
              <button 
                (click)="confermaRichiestaTessera()" 
                [disabled]="confirmingRequest">
                @if (confirmingRequest) {
                  Confermando...
                } @else {
                  Conferma
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Feedback -->
      @if (feedbackMessage) {
        <div class="feedback" [class]="feedbackType">
          {{ feedbackMessage }}
        </div>
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
      text-align: center;
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

    h3 {
      margin: 0 0 15px 0;
      text-align: center;
    }

    .section {
      margin-bottom: 30px;
    }

    .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      margin-bottom: 10px;
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

    button {
      padding: 8px 12px;
      border: 1px solid #ccc;
      background: white;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover:not(:disabled) {
      background: #f0f0f0;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #f8f8f8;
    }

    .status-attiva { 
      background: #d4f4dd; 
      padding: 3px 6px; 
      border-radius: 3px;
    }

    .status-sospesa { 
      background: #fff3cd; 
      padding: 3px 6px; 
      border-radius: 3px;
    }

    .status-scaduta { 
      background: #f8d7da; 
      padding: 3px 6px; 
      border-radius: 3px;
    }

    .price-free {
      background: #d4f4dd;
      color: #2d5a3d;
      padding: 3px 6px;
      border-radius: 3px;
      font-weight: bold;
    }

    .price-paid {
      background: #fff3cd;
      color: #856404;
      padding: 3px 6px;
      border-radius: 3px;
      font-weight: bold;
    }

    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 10px;
      border: 1px solid #f5c6cb;
      margin: 10px 0;
      text-align: center;
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

    .modal {
      background: white;
      border: 1px solid #ccc;
      padding: 20px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-info {
      margin-bottom: 15px;
      padding: 10px;
      background: #f8f8f8;
      border: 1px solid #ddd;
    }

    .modal-info p {
      margin: 5px 0;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .feedback {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 15px;
      border: 1px solid;
      z-index: 1001;
      max-width: 300px;
    }

    .feedback.success {
      background: #d4edda;
      color: #155724;
      border-color: #c3e6cb;
    }

    .feedback.error {
      background: #f8d7da;
      color: #721c24;
      border-color: #f5c6cb;
    }

    @media (max-width: 600px) {
      .item {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }

      .item > div {
        text-align: left;
        padding: 0;
      }

      .item > div:last-child {
        text-align: left;
      }

      .modal {
        margin: 10px;
        width: calc(100% - 20px);
      }

      .modal-actions {
        flex-direction: column;
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
    private router: Router
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
    
    this.apiService.getTipologieDisponibili().subscribe({
      next: (tipologie) => {
        this.tipologieTessere = tipologie.filter(t => t.attiva);
        this.isLoading = false;
        console.log('Tipologie disponibili:', tipologie.length);
      },
      error: (error) => {
        console.error('Errore caricamento tipologie disponibili:', error);
        
        // Fallback: usa l'endpoint pubblico
        this.apiService.getAllTipologie().subscribe({
          next: (tipologie) => {
            this.tipologieTessere = tipologie.filter(t => t.attiva);
            this.isLoading = false;
            console.warn('Usato endpoint pubblico come fallback');
          },
          error: (fallbackError) => {
            console.error('Errore anche con endpoint pubblico:', fallbackError);
            this.error = 'Errore nel caricamento delle tipologie tessera';
            this.isLoading = false;
          }
        });
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

  hasTesseraOfType(tipologiaId: number): boolean {
    return this.mieTessere.some(tessera => tessera.tipologia.id === tipologiaId);
  }

  richiedeTessera(tipologia: TipologiaTessera): void {
    this.selectedTipologia = tipologia;
    this.showConfirmModal = true;
  }

  confermaRichiestaTessera(): void {
    if (!this.selectedTipologia) return;
    
    this.confirmingRequest = true;
    
    const note = prompt('Note aggiuntive (opzionale):', '') || '';
    
    this.apiService.richiedeTessera(this.selectedTipologia.id, note).subscribe({
      next: () => {
        this.showFeedback('Richiesta tessera inviata! In attesa di approvazione.', 'success');
        this.closeConfirmModal();
        this.loadMieTessere();
        this.confirmingRequest = false;
      },
      error: (error) => {
        console.error('Errore richiesta tessera:', error);
        
        let errorMessage = 'Errore durante la richiesta';
        if (error.status === 409) {
          errorMessage = 'Hai già una richiesta in corso o una tessera di questo tipo';
        } else if (error.status === 403) {
          errorMessage = 'Non autorizzato a richiedere questa tessera';
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
}
