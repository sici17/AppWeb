// src/app/components/risorse/risorse.component.ts - ERRORI TYPESCRIPT RISOLTI
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Risorsa, TesseraLibreria } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

// Interface per la creazione del prestito
interface CreatePrestitoRequest {
  risorsa: { id: number };
  dataInizio: string;
  dataScadenza: string;
  stato: string;
}

@Component({
  selector: 'app-risorse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="risorse-container">
      <h2>Catalogo Risorse</h2>
      
      <div class="search-section">
        <input 
          type="text" 
          [(ngModel)]="searchTerm" 
          placeholder="Cerca per titolo..."
          class="search-input"
        >
        <button (click)="onSearch()" class="search-btn">Cerca</button>
        <button (click)="loadAllRisorse()" class="reset-btn">Mostra tutte</button>
      </div>

      <!-- Info crediti utente -->
      @if (isLoggedIn && userCredits !== null) {
        <div class="credits-info">
          <span class="credits-badge">
            💳 Crediti disponibili: {{ userCredits }}
          </span>
        </div>
      }

      @if (isLoading) {
        <div class="loading">Caricamento risorse...</div>
      }

      @if (error) {
        <div class="error">{{ error }}</div>
      }

      @if (filteredRisorse.length === 0 && !isLoading && !error) {
        <div class="no-results">Nessuna risorsa trovata</div>
      }

      <div class="risorse-grid">
        @for (risorsa of filteredRisorse; track risorsa.id) {
          <div class="risorsa-card" [class.unavailable]="risorsa.copieDisponibili === 0">
            <div class="card-header">
              <h3>{{ risorsa.titolo }}</h3>
              <span class="tipo-badge" [class]="'tipo-' + risorsa.tipo.toLowerCase()">
                {{ risorsa.tipo }}
              </span>
            </div>
            
            <div class="card-content">
              <p><strong>Autore:</strong> {{ risorsa.autore }}</p>
              <p><strong>Editore:</strong> {{ risorsa.editore }}</p>
              <p><strong>Anno:</strong> {{ risorsa.annoPubblicazione }}</p>
              
              <div class="availability">
                <span class="availability-text" [class]="getAvailabilityClass(risorsa)">
                  📚 {{ risorsa.copieDisponibili }}/{{ risorsa.copieTotali }} disponibili
                </span>
                <span class="status-badge" [class]="'status-' + risorsa.stato.toLowerCase()">
                  {{ risorsa.stato }}
                </span>
              </div>
              
              @if (risorsa.descrizione) {
                <p class="descrizione">{{ risorsa.descrizione }}</p>
              }
            </div>

            <div class="card-actions">
              @if (!isLoggedIn) {
                <button class="login-btn" (click)="goToLogin()">
                  🔐 Accedi per prenotare
                </button>
              } @else if (userCredits === 0) {
                <button class="disabled-btn" disabled>
                  💳 Crediti insufficienti
                </button>
              } @else if (risorsa.copieDisponibili === 0) {
                <button class="disabled-btn" disabled>
                  ❌ Non disponibile
                </button>
              } @else {
                <button 
                  (click)="prenotaRisorsa(risorsa)" 
                  class="prenota-btn"
                  [disabled]="bookingInProgress === risorsa.id">
                  @if (bookingInProgress === risorsa.id) {
                    <span class="spinner"></span> Prenotando...
                  } @else {
                    📖 Prenota Risorsa
                  }
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Modal di conferma prenotazione -->
      @if (showBookingModal && selectedRisorsa) {
        <div class="modal-backdrop" (click)="closeBookingModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>Conferma Prenotazione</h3>
            <div class="modal-body">
              <p><strong>Risorsa:</strong> {{ selectedRisorsa.titolo }}</p>
              <p><strong>Autore:</strong> {{ selectedRisorsa.autore }}</p>
              <p><strong>Tipo:</strong> {{ selectedRisorsa.tipo }}</p>
              
              <div class="date-selection">
                <label for="dataInizio">Data inizio prestito:</label>
                <input 
                  type="date" 
                  id="dataInizio"
                  [(ngModel)]="dataInizio"
                  [min]="minDate"
                  class="date-input">
              </div>
              
              <div class="booking-info">
                <p>💳 <strong>Costo:</strong> 1 credito</p>
                <p>📅 <strong>Durata:</strong> 14 giorni</p>
                @if (userCredits !== null) {
                  <p>🔄 <strong>Crediti rimanenti dopo:</strong> {{ userCredits - 1 }}</p>
                }
              </div>
            </div>
            
            <div class="modal-actions">
              <button (click)="closeBookingModal()" class="cancel-btn">
                Annulla
              </button>
              <button 
                (click)="confermaPrenotazione()" 
                class="confirm-btn"
                [disabled]="!dataInizio || confirmingBooking">
                @if (confirmingBooking) {
                  <span class="spinner"></span> Confermando...
                } @else {
                  ✅ Conferma Prenotazione
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
    .risorse-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    h2 {
      text-align: center;
      color: #495057;
      margin-bottom: 2rem;
    }
    
    .search-section {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      align-items: center;
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .search-input {
      flex: 1;
      padding: 10px;
      border: 2px solid #dee2e6;
      border-radius: 6px;
      font-size: 16px;
    }

    .search-input:focus {
      outline: none;
      border-color: #007bff;
    }
    
    .search-btn, .reset-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    
    .search-btn {
      background-color: #007bff;
      color: white;
    }

    .search-btn:hover {
      background-color: #0056b3;
    }
    
    .reset-btn {
      background-color: #6c757d;
      color: white;
    }

    .reset-btn:hover {
      background-color: #545b62;
    }

    .credits-info {
      text-align: center;
      margin-bottom: 1rem;
    }

    .credits-badge {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      display: inline-block;
    }
    
    .loading, .error, .no-results {
      text-align: center;
      padding: 40px;
      font-size: 18px;
      background: white;
      border-radius: 8px;
      margin: 20px 0;
    }

    .loading {
      color: #6c757d;
    }
    
    .error {
      color: #dc3545;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
    }
    
    .risorse-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    
    .risorsa-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .risorsa-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .risorsa-card.unavailable {
      opacity: 0.7;
      border-color: #dc3545;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    
    .card-header h3 {
      margin: 0;
      color: #495057;
      font-size: 1.25rem;
      flex: 1;
      margin-right: 1rem;
    }

    .tipo-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .tipo-libro { background-color: #d4edda; color: #155724; }
    .tipo-rivista { background-color: #cce5ff; color: #004085; }
    .tipo-dvd { background-color: #fff3cd; color: #856404; }
    .tipo-tesi { background-color: #e2e3e5; color: #383d41; }

    .card-content p {
      margin: 0.5rem 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .availability {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 1rem 0;
      padding: 0.5rem;
      background-color: #f8f9fa;
      border-radius: 6px;
    }

    .availability-text {
      font-weight: 600;
    }

    .availability-text.available { color: #28a745; }
    .availability-text.limited { color: #ffc107; }
    .availability-text.unavailable { color: #dc3545; }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-disponibile { background-color: #d4edda; color: #155724; }
    .status-prestito { background-color: #fff3cd; color: #856404; }
    .status-manutenzione { background-color: #f8d7da; color: #721c24; }
    
    .descrizione {
      color: #6c757d;
      font-style: italic;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    .card-actions {
      margin-top: 1rem;
      text-align: center;
    }
    
    .prenota-btn, .login-btn, .disabled-btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .prenota-btn {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
    }

    .prenota-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
    }

    .login-btn {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
    }

    .login-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
    }

    .disabled-btn {
      background-color: #6c757d;
      color: white;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .prenota-btn:disabled {
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
      color: #495057;
      text-align: center;
    }

    .modal-body p {
      margin: 0.5rem 0;
      color: #6c757d;
    }

    .date-selection {
      margin: 1.5rem 0;
    }

    .date-selection label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #495057;
    }

    .date-input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #dee2e6;
      border-radius: 6px;
      font-size: 16px;
    }

    .date-input:focus {
      outline: none;
      border-color: #007bff;
    }

    .booking-info {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .booking-info p {
      margin: 0.5rem 0;
      color: #495057;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .cancel-btn, .confirm-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .cancel-btn {
      background-color: #6c757d;
      color: white;
    }

    .cancel-btn:hover {
      background-color: #545b62;
    }

    .confirm-btn {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
    }

    .confirm-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
    }

    .confirm-btn:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
      transform: none;
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
      .risorse-grid {
        grid-template-columns: 1fr;
      }

      .search-section {
        flex-direction: column;
        gap: 0.5rem;
      }

      .search-input {
        width: 100%;
      }

      .modal-content {
        margin: 1rem;
        width: calc(100% - 2rem);
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `]
})
export class RisorseComponent implements OnInit {
  risorse: Risorsa[] = [];
  filteredRisorse: Risorsa[] = [];
  searchTerm = '';
  isLoading = true;
  error = '';
  
  // Stato utente
  isLoggedIn = false;
  userCredits: number | null = null;
  
  // Stato prenotazione
  bookingInProgress: number | null = null;
  showBookingModal = false;
  selectedRisorsa: Risorsa | null = null;
  dataInizio = '';
  minDate = '';
  confirmingBooking = false;
  
  // Feedback
  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.setMinDate();
    this.loadAllRisorse();
    
    if (this.isLoggedIn) {
      this.loadUserCredits();
    }
  }

  private setMinDate(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.dataInizio = this.minDate;
  }

  loadAllRisorse(): void {
    this.isLoading = true;
    this.error = '';
    this.apiService.getAllRisorse().subscribe({
      next: (data: Risorsa[]) => {
        this.risorse = data;
        this.filteredRisorse = data;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Errore nel caricamento risorse:', error);
        this.error = 'Errore nel caricamento delle risorse';
        this.isLoading = false;
      }
    });
  }

  private loadUserCredits(): void {
    this.apiService.getUserCredits().subscribe({
      next: (crediti) => {
        this.userCredits = crediti;
      },
      error: (error) => {
        console.error('Errore caricamento crediti:', error);
        this.userCredits = 0;
      }
    });
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.isLoading = true;
      this.apiService.searchRisorseByTitle(this.searchTerm).subscribe({
        next: (data: Risorsa[]) => {
          this.filteredRisorse = data;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Errore nella ricerca:', error);
          this.error = 'Errore nella ricerca';
          this.isLoading = false;
        }
      });
    } else {
      this.filteredRisorse = this.risorse;
    }
  }

  getAvailabilityClass(risorsa: Risorsa): string {
    if (risorsa.copieDisponibili === 0) return 'unavailable';
    if (risorsa.copieDisponibili <= risorsa.copieTotali * 0.3) return 'limited';
    return 'available';
  }

  prenotaRisorsa(risorsa: Risorsa): void {
    if (!this.isLoggedIn) {
      this.goToLogin();
      return;
    }

    if (this.userCredits === 0) {
      this.showFeedback('Crediti insufficienti per effettuare la prenotazione', 'error');
      return;
    }
    
    this.selectedRisorsa = risorsa;
    this.showBookingModal = true;
  }

  confermaPrenotazione(): void {
      if (!this.selectedRisorsa || !this.dataInizio) {
        this.showFeedback('Dati mancanti per la prenotazione', 'error');
        return;
      }
      
      this.confirmingBooking = true;
      
      // ✅ Calcola la data di fine corretta
      const dataScadenza = this.calculateEndDate(this.dataInizio);
      
      // ✅ Crea l'oggetto richiesta nel formato corretto
      const prestitoRequest: CreatePrestitoRequest = {
        risorsa: { 
          id: this.selectedRisorsa.id 
        },
        dataInizio: this.dataInizio, // Già in formato YYYY-MM-DD
        dataScadenza: dataScadenza,   // Calcolata correttamente
        stato: 'ATTIVO'
      };

      console.log('📅 Dati prenotazione:', {
        risorsa: this.selectedRisorsa.titolo,
        id: this.selectedRisorsa.id,
        dataInizio: this.dataInizio,
        dataScadenza: dataScadenza,
        creditiAttuali: this.userCredits
      });

      // ✅ Chiamata API corretta
      this.apiService.createPrestito(prestitoRequest).subscribe({
        next: (prestito) => {
          console.log('✅ Prenotazione completata:', prestito);
          
          this.showFeedback(
            `Prenotazione confermata! Il prestito inizierà il ${this.formatDateForDisplay(this.dataInizio)} e scadrà il ${this.formatDateForDisplay(dataScadenza)}.`,
            'success'
          );
          
          // Aggiorna i dati locali
          this.closeBookingModal();
          this.loadUserCredits(); // Ricarica i crediti aggiornati
          this.loadAllRisorse();  // Ricarica le risorse per aggiornare disponibilità
          
          this.confirmingBooking = false;
        },
        error: (error) => {
          console.error('❌ Errore prenotazione:', error);
          
          let errorMessage = 'Errore durante la prenotazione';
          
          // ✅ Gestione errori specifica
          switch (error.status) {
            case 412: // PRECONDITION_FAILED
              errorMessage = 'Crediti insufficienti per effettuare la prenotazione';
              break;
            case 400: // BAD_REQUEST
              errorMessage = error.error?.includes('data passata') 
                ? 'Non è possibile prenotare per una data passata'
                : 'Dati non validi per la prenotazione';
              break;
            case 409: // CONFLICT
              errorMessage = 'Hai già un prestito attivo per questa risorsa';
              break;
            case 404: // NOT_FOUND
              if (error.error?.includes('Risorsa')) {
                errorMessage = 'Risorsa non più disponibile';
              } else if (error.error?.includes('Utente')) {
                errorMessage = 'Errore di autenticazione - rieffettua il login';
              }
              break;
            case 401: // UNAUTHORIZED
              errorMessage = 'Sessione scaduta - rieffettua il login';
              break;
            case 403: // FORBIDDEN
              errorMessage = 'Non hai i permessi per effettuare prenotazioni';
              break;
            default:
              if (error.error && typeof error.error === 'string') {
                errorMessage = error.error;
              }
          }
          
          this.showFeedback(errorMessage, 'error');
          this.confirmingBooking = false;
        }
      });
    }
	   
	   
	   
	  
	private formatDateForDisplay(dateString: string): string {
	   const date = new Date(dateString + 'T00:00:00');
	   return date.toLocaleDateString('it-IT', {
	     day: '2-digit',
	     month: '2-digit',
	     year: 'numeric'
	   });
	 }
	   
	   
	 private setMinDate(): void {
	     const today = new Date();
	     // Imposta alla mezzanotte per evitare problemi di timezone
	     today.setHours(0, 0, 0, 0);
	     this.minDate = today.toISOString().split('T')[0];
	     this.dataInizio = this.minDate;
	     
	     console.log('📅 Data minima impostata:', this.minDate);
	   }
		
		
		
	   prenotaRisorsa(risorsa: Risorsa): void {
	       console.log('🎯 Tentativo prenotazione risorsa:', risorsa.titolo);
	       
	       if (!this.isLoggedIn) {
	         console.log('❌ Utente non loggato - redirect al login');
	         this.goToLogin();
	         return;
	       }

	       if (this.userCredits === null || this.userCredits <= 0) {
	         console.log('❌ Crediti insufficienti:', this.userCredits);
	         this.showFeedback('Crediti insufficienti per effettuare la prenotazione', 'error');
	         return;
	       }

	       if (risorsa.copieDisponibili <= 0) {
	         console.log('❌ Risorsa non disponibile');
	         this.showFeedback('Risorsa non più disponibile', 'error');
	         return;
	       }
	       
	       console.log('✅ Validazione passed - apertura modal prenotazione');
	       this.selectedRisorsa = risorsa;
	       this.showBookingModal = true;
	     }

	  
	  
	  

		  private calculateEndDate(startDate: string): string {
		     const start = new Date(startDate + 'T00:00:00'); // Evita problemi di timezone
		     const end = new Date(start);
		     end.setDate(start.getDate() + 14); // Aggiunge 14 giorni
		     
		     // Ritorna nel formato YYYY-MM-DD
		     return end.toISOString().split('T')[0];
		   }
 
		 
		 
		 

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.selectedRisorsa = null;
    this.dataInizio = this.minDate;
    this.confirmingBooking = false;
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: '/risorse' } 
    });
  }

  private showFeedback(message: string, type: 'success' | 'error'): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
    
    // Auto-hide dopo 5 secondi
    setTimeout(() => {
      this.feedbackMessage = '';
    }, 5000);
  }
}