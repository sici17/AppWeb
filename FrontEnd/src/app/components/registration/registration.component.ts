// src/app/components/registration/registration.component.ts - Solo automatica con debug
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs'; // Aggiunto import
import { ApiService, RegistrationData } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="registration-container">
      <h2>🔐 Registrazione Automatica</h2>
      
      <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-group">
          <label for="username">Username:</label>
          <input 
            type="text" 
            id="username" 
            formControlName="username"
            class="form-control"
            [class.is-invalid]="registrationForm.get('username')?.invalid && registrationForm.get('username')?.touched"
            placeholder="Inserisci username"
          >
          @if (registrationForm.get('username')?.invalid && registrationForm.get('username')?.touched) {
            <div class="invalid-feedback">
              Username richiesto (min 3 caratteri)
            </div>
          }
        </div>

        <div class="form-group">
          <label for="firstName">Nome:</label>
          <input 
            type="text" 
            id="firstName" 
            formControlName="firstName"
            class="form-control"
            [class.is-invalid]="registrationForm.get('firstName')?.invalid && registrationForm.get('firstName')?.touched"
            placeholder="Inserisci nome"
          >
          @if (registrationForm.get('firstName')?.invalid && registrationForm.get('firstName')?.touched) {
            <div class="invalid-feedback">
              Nome richiesto
            </div>
          }
        </div>

        <div class="form-group">
          <label for="lastName">Cognome:</label>
          <input 
            type="text" 
            id="lastName" 
            formControlName="lastName"
            class="form-control"
            [class.is-invalid]="registrationForm.get('lastName')?.invalid && registrationForm.get('lastName')?.touched"
            placeholder="Inserisci cognome"
          >
          @if (registrationForm.get('lastName')?.invalid && registrationForm.get('lastName')?.touched) {
            <div class="invalid-feedback">
              Cognome richiesto
            </div>
          }
        </div>

        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            formControlName="email"
            class="form-control"
            [class.is-invalid]="registrationForm.get('email')?.invalid && registrationForm.get('email')?.touched"
            placeholder="Inserisci email"
          >
          @if (registrationForm.get('email')?.invalid && registrationForm.get('email')?.touched) {
            <div class="invalid-feedback">
              Email valida richiesta
            </div>
          }
        </div>

        <div class="form-group">
          <label for="password">Password:</label>
          <input 
            type="password" 
            id="password" 
            formControlName="password"
            class="form-control"
            [class.is-invalid]="registrationForm.get('password')?.invalid && registrationForm.get('password')?.touched"
            placeholder="Inserisci password"
          >
          @if (registrationForm.get('password')?.invalid && registrationForm.get('password')?.touched) {
            <div class="invalid-feedback">
              Password richiesta (min 6 caratteri)
            </div>
          }
        </div>

        <div class="form-group">
          <label for="sesso">Sesso:</label>
          <select id="sesso" formControlName="sesso" class="form-control">
            <option value="MASCHIO">Maschio</option>
            <option value="FEMMINA">Femmina</option>
            <option value="ALTRO">Altro</option>
          </select>
        </div>

        <!-- Debug section -->
        <div class="debug-section" *ngIf="debugMode">
          <h4>🔧 Debug Info:</h4>
          <pre>{{ debugInfo | json }}</pre>
        </div>

        <button 
          type="submit" 
          class="btn btn-primary" 
          [disabled]="registrationForm.invalid || isLoading">
          @if (isLoading) {
            <span class="spinner"></span>
            <span>{{ currentStep }}</span>
          } @else {
            <span>🚀 Registrazione Automatica</span>
          }
        </button>

        <!-- Toggle debug -->
        <button 
          type="button" 
          (click)="toggleDebug()" 
          class="btn btn-secondary debug-btn">
          {{ debugMode ? 'Nascondi Debug' : 'Mostra Debug' }}
        </button>

        <!-- Progress -->
        @if (isLoading) {
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progressPercent"></div>
          </div>
          <div class="step-info">{{ currentStep }}</div>
        }

        @if (message) {
          <div class="message" 
               [class.success]="isSuccess" 
               [class.error]="!isSuccess">
            {{ message }}
          </div>
        }

        @if (isSuccess) {
          <div class="success-actions">
            <button (click)="goToLogin()" class="btn btn-success">
              🚪 Vai al Login
            </button>
          </div>
        }
      </form>
    </div>
  `,
  styles: [`
    .registration-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .form-control {
      width: 100%;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 16px;
    }
    
    .form-control.is-invalid {
      border-color: #dc3545;
    }
    
    .invalid-feedback {
      display: block;
      width: 100%;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: #dc3545;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s;
      margin: 10px 5px;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      width: 100%;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
      width: auto;
    }
    
    .btn-success {
      background-color: #28a745;
      color: white;
    }
    
    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
    
    .debug-btn {
      font-size: 12px;
      padding: 6px 12px;
    }
    
    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid transparent;
      border-top: 3px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: #e9ecef;
      border-radius: 4px;
      margin: 15px 0;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #007bff, #28a745);
      transition: width 0.5s ease;
    }
    
    .step-info {
      text-align: center;
      font-size: 14px;
      color: #6c757d;
      margin-bottom: 10px;
    }
    
    .debug-section {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
      font-size: 12px;
    }
    
    .debug-section pre {
      background: white;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
    
    .message {
      margin-top: 15px;
      padding: 15px;
      border-radius: 6px;
      font-weight: 500;
    }
    
    .message.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .message.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .success-actions {
      text-align: center;
      margin-top: 20px;
    }
  `]
})
export class RegistrationComponent {
  registrationForm: FormGroup;
  isLoading = false;
  message = '';
  isSuccess = false;
  currentStep = '';
  progressPercent = 0;
  debugMode = false;
  debugInfo: any = {};

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.registrationForm = this.fb.group({
      username: ['testuser' + Date.now().toString().slice(-4), [Validators.required, Validators.minLength(3)]], // Pre-filled per test
      firstName: ['Mario', [Validators.required]],
      lastName: ['Rossi', [Validators.required]],
      email: ['mario.rossi@test.com', [Validators.required, Validators.email]],
      password: ['password123', [Validators.required, Validators.minLength(6)]],
      sesso: ['MASCHIO', [Validators.required]]
    });
  }

  toggleDebug(): void {
    this.debugMode = !this.debugMode;
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      const registrationData: RegistrationData = {
        ...this.registrationForm.value,
        id: 0
      };

      this.performAutomaticRegistration(registrationData);
    } else {
      this.message = 'Compila tutti i campi correttamente.';
      this.isSuccess = false;
      
      Object.keys(this.registrationForm.controls).forEach(key => {
        this.registrationForm.get(key)?.markAsTouched();
      });
    }
  }

  private performAutomaticRegistration(registrationData: RegistrationData): void {
    this.isLoading = true;
    this.message = '';
    this.isSuccess = false;
    this.progressPercent = 0;
    this.debugInfo = { step: 'Inizio', data: registrationData };

    console.log('🚀 === INIZIO REGISTRAZIONE AUTOMATICA ===');
    console.log('Dati:', registrationData);

    // STEP 1: Test connessione Keycloak
    this.currentStep = 'Test connessione Keycloak...';
    this.progressPercent = 10;
    this.debugInfo = { ...this.debugInfo, step: 'Test connessione' };

    this.authService.testKeycloakConnection().subscribe({
      next: (connectionResult) => {
        console.log('✅ Keycloak raggiungibile:', connectionResult);
        this.debugInfo = { ...this.debugInfo, keycloakConnection: 'OK', connectionResult };

        // STEP 2: Ottieni token admin
        this.currentStep = 'Ottenimento token admin...';
        this.progressPercent = 30;
        this.debugInfo = { ...this.debugInfo, step: 'Token admin' };

        this.testAdminToken().subscribe({
          next: (tokenResult: string) => {
            console.log('✅ Token admin ottenuto');
            this.debugInfo = { ...this.debugInfo, adminToken: 'OK' };

            // STEP 3: Crea utente in Keycloak
            this.currentStep = 'Creazione utente in Keycloak...';
            this.progressPercent = 50;
            this.debugInfo = { ...this.debugInfo, step: 'Creazione Keycloak' };

            this.authService.registerUserInKeycloak(registrationData).subscribe({
              next: (keycloakSuccess: boolean) => {
                if (keycloakSuccess) {
                  console.log('✅ Utente creato in Keycloak');
                  this.debugInfo = { ...this.debugInfo, keycloakCreation: 'OK' };

                  // STEP 4: Crea utente nel database
                  this.currentStep = 'Registrazione nel database...';
                  this.progressPercent = 80;
                  this.debugInfo = { ...this.debugInfo, step: 'Database' };

                  this.apiService.registerUser(registrationData).subscribe({
                    next: (dbResponse: any) => {
                      console.log('✅ Utente creato nel database:', dbResponse);
                      this.debugInfo = { ...this.debugInfo, databaseCreation: 'OK', dbResponse };

                      // STEP 5: Completato!
                      this.currentStep = 'Completato!';
                      this.progressPercent = 100;

                      setTimeout(() => {
                        this.message = '🎉 Registrazione completata con successo! Utente creato sia in Keycloak che nel database.';
                        this.isSuccess = true;
                        this.isLoading = false;
                        console.log('🎉 === REGISTRAZIONE COMPLETATA CON SUCCESSO ===');
                      }, 1000);
                    },
                    error: (dbError: any) => {
                      console.error('❌ Errore database:', dbError);
                      this.debugInfo = { ...this.debugInfo, databaseError: dbError };
                      this.message = `❌ Errore durante la registrazione nel database: ${dbError.message || 'Errore sconosciuto'}. L'utente è stato creato in Keycloak.`;
                      this.isSuccess = false;
                      this.isLoading = false;
                    }
                  });
                } else {
                  console.error('❌ Creazione utente Keycloak fallita');
                  this.debugInfo = { ...this.debugInfo, keycloakCreation: 'FAILED' };
                  this.message = '❌ Errore durante la creazione utente in Keycloak.';
                  this.isSuccess = false;
                  this.isLoading = false;
                }
              },
              error: (keycloakError: any) => {
                console.error('❌ Errore Keycloak registration:', keycloakError);
                this.debugInfo = { ...this.debugInfo, keycloakError: keycloakError };
                this.message = `❌ Errore Keycloak: ${keycloakError.message || 'Errore sconosciuto'}`;
                this.isSuccess = false;
                this.isLoading = false;
              }
            });
          },
          error: (tokenError: any) => {
            console.error('❌ Errore token admin:', tokenError);
            this.debugInfo = { ...this.debugInfo, tokenError: tokenError };
            this.message = `❌ Errore ottenimento token admin: ${tokenError.message || 'Verifica credenziali admin'}`;
            this.isSuccess = false;
            this.isLoading = false;
          }
        });
      },
      error: (connectionError: any) => {
        console.error('❌ Keycloak non raggiungibile:', connectionError);
        this.debugInfo = { ...this.debugInfo, connectionError: connectionError };
        this.message = `❌ Keycloak non raggiungibile: ${connectionError.message || 'Verifica che Keycloak sia attivo su localhost:8080'}`;
        this.isSuccess = false;
        this.isLoading = false;
      }
    });
  }

  private testAdminToken(): Observable<string> {
    // Test diretto del token admin usando il tipo corretto
    return (this.authService as any).getAdminToken(); // Cast per accedere al metodo privato
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}