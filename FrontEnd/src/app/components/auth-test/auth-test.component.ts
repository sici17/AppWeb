// src/app/components/auth-test/auth-test.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-auth-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>Test Autenticazione</h2>
      
      <div class="test-section">
        <h3>Stato Autenticazione</h3>
        <p><strong>Loggato:</strong> {{ isLoggedIn ? 'Sì' : 'No' }}</p>
        <p><strong>È Admin:</strong> {{ isAdmin ? 'Sì' : 'No' }}</p>
        <p><strong>È Utente:</strong> {{ isUser ? 'Sì' : 'No' }}</p>
      </div>

      @if (currentUser) {
        <div class="test-section">
          <h3>Informazioni Utente</h3>
          <pre>{{ currentUser | json }}</pre>
        </div>
      }

      <div class="test-section">
        <h3>Test API Protette</h3>
        <button (click)="testProtectedEndpoint()" class="btn btn-primary">
          Test Endpoint Protetto
        </button>
        @if (apiTestResult) {
          <div class="api-result">
            <h4>Risultato:</h4>
            <pre>{{ apiTestResult | json }}</pre>
          </div>
        }
        @if (apiError) {
          <div class="api-error">
            <h4>Errore:</h4>
            <p>{{ apiError }}</p>
          </div>
        }
      </div>

      <div class="test-section">
        <h3>Azioni</h3>
        <button (click)="refreshUserInfo()" class="btn btn-secondary">
          Ricarica Info Utente
        </button>
        <button (click)="testTokenRefresh()" class="btn btn-secondary">
          Test Refresh Token
        </button>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }
    
    .test-section {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .btn {
      padding: 8px 16px;
      margin: 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    pre {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
    
    .api-result {
      margin-top: 15px;
      padding: 10px;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
    }
    
    .api-error {
      margin-top: 15px;
      padding: 10px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }
  `]
})
export class AuthTestComponent implements OnInit {
  currentUser: any = null;
  isLoggedIn = false;
  isAdmin = false;
  isUser = false;
  apiTestResult: any = null;
  apiError = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.updateAuthStatus();
    
    // Sottoscrivi ai cambiamenti dell'utente
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateAuthStatus();
    });
  }

  updateAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.isAdmin = this.authService.isAdmin();
    this.isUser = this.authService.isUser();
  }

  testProtectedEndpoint(): void {
    this.apiError = '';
    this.apiTestResult = null;
    
    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        this.apiTestResult = user;
      },
      error: (error) => {
        this.apiError = `Errore: ${error.status} - ${error.message}`;
        console.error('Errore test API:', error);
      }
    });
  }

  refreshUserInfo(): void {
    this.authService.getUserInfo().subscribe({
      next: (userInfo) => {
        console.log('Info utente aggiornate:', userInfo);
      },
      error: (error) => {
        console.error('Errore refresh info utente:', error);
      }
    });
  }

  testTokenRefresh(): void {
    this.authService.refreshToken().subscribe({
      next: (success) => {
        console.log('Refresh token:', success ? 'Successo' : 'Fallito');
      },
      error: (error) => {
        console.error('Errore refresh token:', error);
      }
    });
  }
}