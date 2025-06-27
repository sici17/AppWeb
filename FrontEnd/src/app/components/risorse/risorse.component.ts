// src/app/components/risorse/risorse.component.ts - DESIGN MINIMALE
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Risorsa, CreatePrestitoRequest } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-risorse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Catalogo Risorse</h1>
      </div>
      
      <!-- Ricerca -->
      <div class="search-section">
        <input 
          type="text" 
          [(ngModel)]="searchTerm" 
          placeholder="Cerca per titolo..."
          class="search-input">
        <button (click)="onSearch()">Cerca</button>
        <button (click)="loadAllRisorse()">Mostra tutte</button>
      </div>

      <!-- Info crediti -->
      @if (isLoggedIn && userCredits !== null) {
        <div class="credits">
          <span>Crediti disponibili: {{ userCredits }}</span>
        </div>
      }

      @if (isLoading) {
        <p>Caricamento risorse...</p>
      }

      @if (error) {
        <div class="error">{{ error }}</div>
      }

      @if (filteredRisorse.length === 0 && !isLoading && !error) {
        <p>Nessuna risorsa trovata</p>
      }

      <!-- Lista Risorse -->
      @for (risorsa of filteredRisorse; track risorsa.id) {
        <div class="risorsa" [class.unavailable]="risorsa.copieDisponibili === 0">
          <div class="risorsa-info">
            <strong>{{ risorsa.titolo }}</strong>
            <br>Autore: {{ risorsa.autore }}
            <br>Editore: {{ risorsa.editore }} ({{ risorsa.annoPubblicazione }})
            <br>Tipo: {{ risorsa.tipo }}
            @if (risorsa.descrizione) {
              <br><em>{{ risorsa.descrizione }}</em>
            }
          </div>
          
          <div class="risorsa-status">
            <span class="availability" [class]="getAvailabilityClass(risorsa)">
              {{ risorsa.copieDisponibili }}/{{ risorsa.copieTotali }} disponibili
            </span>
            <br><span class="status-{{ risorsa.stato.toLowerCase() }}">
              {{ risorsa.stato }}
            </span>
          </div>

          <div class="risorsa-actions">
            @if (!isLoggedIn) {
              <button (click)="goToLogin()">Accedi per prenotare</button>
            } @else if (userCredits === 0) {
              <button disabled>Crediti insufficienti</button>
            } @else if (risorsa.copieDisponibili === 0) {
              <button disabled>Non disponibile</button>
            } @else {
              <button 
                (click)="prenotaRisorsa(risorsa)" 
                [disabled]="bookingInProgress === risorsa.id">
                @if (bookingInProgress === risorsa.id) {
                  Prenotando...
                } @else {
                  Prenota
                }
              </button>
            }
          </div>
        </div>
      }

      <!-- Modal prenotazione -->
      @if (showBookingModal && selectedRisorsa) {
        <div class="modal-backdrop" (click)="closeBookingModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Conferma Prenotazione</h3>
            
            <div class="modal-info">
              <p><strong>Risorsa:</strong> {{ selectedRisorsa.titolo }}</p>
              <p><strong>Autore:</strong> {{ selectedRisorsa.autore }}</p>
              <p><strong>Tipo:</strong> {{ selectedRisorsa.tipo }}</p>
            </div>
            
            <div class="field">
              <label for="dataInizio">Data inizio prestito:</label>
              <input 
                type="date" 
                id="dataInizio"
                [(ngModel)]="dataInizio"
                [min]="minDate">
            </div>
            
            <div class="booking-details">
              <p>Costo: 1 credito</p>
              <p>Durata: 14 giorni</p>
              @if (userCredits !== null) {
                <p>Crediti rimanenti dopo: {{ userCredits - 1 }}</p>
              }
            </div>
            
            <div class="modal-actions">
              <button (click)="closeBookingModal()">Annulla</button>
              <button 
                (click)="confermaPrenotazione()" 
                [disabled]="!dataInizio || confirmingBooking">
                @if (confirmingBooking) {
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
    
    .search-section {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      align-items: center;
    }
    
    .search-input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ccc;
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: #666;
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

    .credits {
      text-align: center;
      margin-bottom: 20px;
      padding: 10px;
      background: #f0f8f0;
      border: 1px solid #ccc;
      font-weight: bold;
    }
    
    .risorsa {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      background: white;
    }

    .risorsa.unavailable {
      opacity: 0.6;
      background: #f8f8f8;
    }

    .risorsa-info {
      flex: 2;
      padding-right: 15px;
    }

    .risorsa-info strong {
      font-size: 16px;
    }

    .risorsa-status {
      flex: 1;
      text-align: center;
      padding: 0 15px;
    }

    .risorsa-actions {
      flex: 1;
      text-align: right;
    }

    .availability {
      font-weight: bold;
      padding: 3px 6px;
      border-radius: 3px;
    }

    .availability.available { 
      background: #d4f4dd; 
      color: #2d5a3d;
    }

    .availability.limited { 
      background: #fff3cd; 
      color: #856404;
    }

    .availability.unavailable { 
      background: #f8d7da; 
      color: #721c24;
    }

    .status-disponibile { 
      background: #d4f4dd; 
      padding: 2px 5px; 
      border-radius: 3px;
    }

    .status-prestito { 
      background: #fff3cd; 
      padding: 2px 5px; 
      border-radius: 3px;
    }

    .status-manutenzione { 
      background: #f8d7da; 
      padding: 2px 5px; 
      border-radius: 3px;
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

    .modal h3 {
      margin: 0 0 15px 0;
      text-align: center;
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

    .field {
      margin: 15px 0;
    }

    .field label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .field input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      box-sizing: border-box;
    }

    .booking-details {
      margin: 15px 0;
      padding: 10px;
      background: #f0f8f0;
      border: 1px solid #ccc;
    }

    .booking-details p {
      margin: 5px 0;
      font-weight: bold;
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

    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 10px;
      border: 1px solid #f5c6cb;
      margin: 10px 0;
      text-align: center;
    }

    @media (max-width: 600px) {
      .risorsa {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }

      .risorsa-info, .risorsa-status, .risorsa-actions {
        text-align: left;
        padding: 0;
      }

      .search-section {
        flex-direction: column;
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
        console.error('Errore caricamento risorse:', error);
        this.error = 'Errore nel caricamento delle risorse';
        this.isLoading = false;
      }
    });
  }

  private loadUserCredits(): void {
    this.apiService.getUserCredits().subscribe({
      next: (crediti) => this.userCredits = crediti,
      error: () => this.userCredits = 0
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
        error: () => {
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
      this.showFeedback('Crediti insufficienti per la prenotazione', 'error');
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
    
    const dataScadenza = this.calculateEndDate(this.dataInizio);
    
    const prestitoRequest: CreatePrestitoRequest = {
      risorsa: { id: this.selectedRisorsa.id },
      dataInizio: this.dataInizio,
      dataScadenza: dataScadenza,
      stato: 'ATTIVO' as const
    };

    this.apiService.createPrestito(prestitoRequest).subscribe({
      next: () => {
        this.showFeedback(
          `Prenotazione confermata! Il prestito inizierà il ${this.formatDateForDisplay(this.dataInizio)}.`,
          'success'
        );
        
        this.closeBookingModal();
        this.loadUserCredits();
        this.loadAllRisorse();
        this.confirmingBooking = false;
      },
      error: (error) => {
        let errorMessage = 'Errore durante la prenotazione';
        
        switch (error.status) {
          case 412:
            errorMessage = 'Crediti insufficienti';
            break;
          case 400:
            errorMessage = 'Dati non validi per la prenotazione';
            break;
          case 409:
            errorMessage = 'Hai già un prestito attivo per questa risorsa';
            break;
          case 404:
            errorMessage = 'Risorsa non più disponibile';
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

  private calculateEndDate(startDate: string): string {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 14);
    return end.toISOString().split('T')[0];
  }

  private formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
    
    setTimeout(() => {
      this.feedbackMessage = '';
    }, 5000);
  }
}