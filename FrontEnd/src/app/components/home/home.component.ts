import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Utente } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <h1>Biblioteca Universitaria</h1>
      <p>Benvenuto nel sistema di gestione biblioteca</p>
      
      <div class="stats" *ngIf="utenti.length > 0">
        <h3>Statistiche:</h3>
        <p>Utenti registrati: {{ utenti.length }}</p>
      </div>

      <div class="loading" *ngIf="isLoading">
        Caricamento dati...
      </div>

      <div class="error" *ngIf="error">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .stats {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .loading {
      color: #666;
    }
    .error {
      color: red;
    }
  `]
})
export class HomeComponent implements OnInit {
  utenti: Utente[] = [];
  isLoading = true;
  error = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.apiService.getAllUsers().subscribe({
      next: (data) => {
        this.utenti = data;
        this.isLoading = false;
        console.log('Connessione al backend riuscita:', data);
      },
      error: (error) => {
        this.error = 'Errore di connessione al backend';
        this.isLoading = false;
        console.error('Errore connessione:', error);
      }
    });
  }
}