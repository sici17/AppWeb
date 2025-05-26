// src/app/components/registration/registration.component.ts - VERSIONE SEMPLICE
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, RegistrationData } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <h2>Registrazione Utente</h2>
      
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="field">
          <label>Username:</label>
          <input 
            type="text" 
            formControlName="username"
            placeholder="Inserisci username">
          <div *ngIf="form.get('username')?.invalid && form.get('username')?.touched" class="error">
            Username richiesto (min 3 caratteri)
          </div>
        </div>

        <div class="field">
          <label>Nome:</label>
          <input 
            type="text" 
            formControlName="firstName"
            placeholder="Inserisci nome">
          <div *ngIf="form.get('firstName')?.invalid && form.get('firstName')?.touched" class="error">
            Nome richiesto
          </div>
        </div>

        <div class="field">
          <label>Cognome:</label>
          <input 
            type="text" 
            formControlName="lastName"
            placeholder="Inserisci cognome">
          <div *ngIf="form.get('lastName')?.invalid && form.get('lastName')?.touched" class="error">
            Cognome richiesto
          </div>
        </div>

        <div class="field">
          <label>Email:</label>
          <input 
            type="email" 
            formControlName="email"
            placeholder="Inserisci email">
          <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="error">
            Email valida richiesta
          </div>
        </div>

        <div class="field">
          <label>Password:</label>
          <input 
            type="password" 
            formControlName="password"
            placeholder="Inserisci password">
          <div *ngIf="form.get('password')?.invalid && form.get('password')?.touched" class="error">
            Password richiesta (min 6 caratteri)
          </div>
        </div>

        <div class="field">
          <label>Sesso:</label>
          <select formControlName="sesso">
            <option value="MASCHIO">Maschio</option>
            <option value="FEMMINA">Femmina</option>
            <option value="ALTRO">Altro</option>
          </select>
        </div>

        <button type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Registrazione...' : 'Registrati' }}
        </button>

        <div *ngIf="message" [class]="isSuccess ? 'success' : 'error'">
          {{ message }}
        </div>

        <div *ngIf="isSuccess" class="actions">
          <button type="button" (click)="goToLogin()">Vai al Login</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .container {
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    
    h2 {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .field {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    input, select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }
    
    button {
      width: 100%;
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
    
    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .error {
      color: red;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .success {
      color: green;
      background-color: #d4edda;
      padding: 10px;
      border-radius: 4px;
      margin-top: 10px;
    }
    
    .error {
      color: red;
      background-color: #f8d7da;
      padding: 10px;
      border-radius: 4px;
      margin-top: 10px;
    }
    
    .actions {
      text-align: center;
      margin-top: 15px;
    }
  `]
})
export class RegistrationComponent {
  form: FormGroup;
  loading = false;
  message = '';
  isSuccess = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      sesso: ['MASCHIO', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading = true;
      this.message = '';
      
      const data: RegistrationData = {
        ...this.form.value,
        id: 0
      };

      // Prima registra in Keycloak
      this.authService.registerUserInKeycloak(data).subscribe({
        next: (keycloakSuccess) => {
          if (keycloakSuccess) {
            // Poi registra nel database
            this.apiService.registerUser(data).subscribe({
              next: () => {
                this.message = 'Registrazione completata con successo!';
                this.isSuccess = true;
                this.loading = false;
              },
              error: () => {
                this.message = 'Utente creato in Keycloak ma errore nel database. Puoi provare il login.';
                this.isSuccess = false;
                this.loading = false;
              }
            });
          } else {
            this.message = 'Errore nella registrazione';
            this.isSuccess = false;
            this.loading = false;
          }
        },
        error: (error) => {
          if (error.status === 409) {
            this.message = 'Username o email già esistenti';
          } else {
            this.message = 'Errore nella registrazione';
          }
          this.isSuccess = false;
          this.loading = false;
        }
      });
    } else {
      // Mostra errori validazione
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}