// src/app/components/registration/registration.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, RegistrationData } from '../../services/api.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Import necessari per standalone
  template: `
    <div class="registration-container">
      <h2>Registrazione Utente</h2>
      
      <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()" class="registration-form">
        <div class="form-group">
          <label for="username">Username:</label>
          <input 
            type="text" 
            id="username" 
            formControlName="username"
            class="form-control"
            placeholder="Inserisci username"
          >
          @if (registrationForm.get('username')?.invalid && registrationForm.get('username')?.touched) {
            <div class="error-message">
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
            placeholder="Inserisci nome"
          >
          @if (registrationForm.get('firstName')?.invalid && registrationForm.get('firstName')?.touched) {
            <div class="error-message">
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
            placeholder="Inserisci cognome"
          >
          @if (registrationForm.get('lastName')?.invalid && registrationForm.get('lastName')?.touched) {
            <div class="error-message">
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
            placeholder="Inserisci email"
          >
          @if (registrationForm.get('email')?.invalid && registrationForm.get('email')?.touched) {
            <div class="error-message">
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
            placeholder="Inserisci password"
          >
          @if (registrationForm.get('password')?.invalid && registrationForm.get('password')?.touched) {
            <div class="error-message">
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

        <button type="submit" 
                class="btn btn-primary" 
                [disabled]="isLoading">
          @if (isLoading) {
            <span>Registrazione...</span>
          } @else {
            <span>Registrati</span>
          }
        </button>

        @if (message) {
          <div class="message" 
               [class.success]="isSuccess" 
               [class.error]="!isSuccess">
            {{ message }}
          </div>
        }
      </form>
    </div>
  `,
  styles: [`
    .registration-container {
      max-width: 500px;
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
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error-message {
      color: red;
      font-size: 0.9em;
      margin-top: 5px;
    }
    .message {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
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
  `]
})
export class RegistrationComponent {
  registrationForm: FormGroup;
  isLoading = false;
  message = '';
  isSuccess = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      sesso: ['MASCHIO', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      this.isLoading = true;
      this.message = '';

      const registrationData: RegistrationData = {
        ...this.registrationForm.value,
        id: 0
      };

      this.apiService.registerUser(registrationData).subscribe({
        next: (response: any) => {
          console.log('Registrazione riuscita:', response);
          this.message = 'Utente registrato con successo!';
          this.isSuccess = true;
          this.isLoading = false;
          
          // Redirect dopo 2 secondi
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('Errore registrazione:', error);
          this.message = 'Errore durante la registrazione. Riprova.';
          this.isSuccess = false;
          this.isLoading = false;
        }
      });
    } else {
      this.message = 'Compila tutti i campi correttamente.';
      this.isSuccess = false;
    }
  }
}