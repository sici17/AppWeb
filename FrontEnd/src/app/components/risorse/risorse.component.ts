// src/app/components/risorse/risorse.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Risorsa } from '../../services/api.service';

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
          <div class="risorsa-card">
            <h3>{{ risorsa.titolo }}</h3>
            <p><strong>Autore:</strong> {{ risorsa.autore }}</p>
            <p><strong>Tipo:</strong> {{ risorsa.tipo }}</p>
            <p><strong>Editore:</strong> {{ risorsa.editore }}</p>
            <p><strong>Anno:</strong> {{ risorsa.annoPubblicazione }}</p>
            <p><strong>Copie disponibili:</strong> {{ risorsa.copieDisponibili }}/{{ risorsa.copieTotali }}</p>
            <p><strong>Stato:</strong> {{ risorsa.stato }}</p>
            @if (risorsa.descrizione) {
              <p class="descrizione">{{ risorsa.descrizione }}</p>
            }
            <button 
              (click)="prenotaRisorsa(risorsa)" 
              class="prenota-btn"
              [disabled]="risorsa.copieDisponibili === 0">
              {{ risorsa.copieDisponibili > 0 ? 'Prenota' : 'Non disponibile' }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .risorse-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
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
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .search-btn, .reset-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .search-btn {
      background-color: #007bff;
      color: white;
    }
    .reset-btn {
      background-color: #6c757d;
      color: white;
    }
    .loading, .error, .no-results {
      text-align: center;
      padding: 20px;
      margin: 20px 0;
    }
    .error {
      color: red;
    }
    .risorse-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .risorsa-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background-color: #f9f9f9;
    }
    .risorsa-card h3 {
      margin-top: 0;
      color: #333;
    }
    .risorsa-card p {
      margin: 8px 0;
      font-size: 0.9em;
    }
    .descrizione {
      color: #666;
      font-style: italic;
    }
    .prenota-btn {
      width: 100%;
      padding: 10px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
    .prenota-btn:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
  `]
})
export class RisorseComponent implements OnInit {
  risorse: Risorsa[] = [];
  filteredRisorse: Risorsa[] = [];
  searchTerm = '';
  isLoading = true;
  error = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAllRisorse();
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

  prenotaRisorsa(risorsa: Risorsa): void {
    alert(`Prenotazione risorsa: ${risorsa.titolo}`);
    // Qui implementerai la logica di prenotazione
  }
}