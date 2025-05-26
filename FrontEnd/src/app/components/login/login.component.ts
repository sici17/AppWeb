// src/app/components/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, LoginCredentials } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Accedi alla Biblioteca</h2>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-group">
            <label for="username">Username:</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username"
              class="form-control"
              [class.is-invalid]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched"
              placeholder="Inserisci username"
            >
            @if (loginForm.get('username')?.invalid && loginForm.get('username')?.touched) {
              <div class="invalid-feedback">
                Username richiesto
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
              [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              placeholder="Inserisci password"
            >
            @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
              <div class="invalid-feedback">
                Password richiesta
              </div>
            }
          </div>

          <button 
            type="submit" 
            class="btn btn-primary"
            [disabled]="loginForm.invalid || isLoading">
            @if (isLoading) {
              <span class="spinner"></span>
              Accesso in corso...
            } @else {
              Accedi
            }
          </button>

          @if (errorMessage) {
            <div class="alert alert-error">
              {{ errorMessage }}
            </div>
          }
        </form>

        <div class="register-link">
          <p>Non hai un account? <a routerLink="/registrazione">Registrati qui</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      backdrop-filter: blur(10px);
    }

    h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
      font-weight: 600;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #555;
    }
    
    .form-control {
      width: 100%;
      padding: 0.875rem;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      box-sizing: border-box;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
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
      width: 100%;
      padding: 0.875rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 1rem;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .alert-error {
      background-color: #f8d7da;
      color: #721c24;
      padding: 0.75rem;
      margin-top: 1rem;
      border-radius: 8px;
      border: 1px solid #f5c6cb;
    }

    .register-link {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e1e5e9;
    }

    .register-link a {
      color: #007bff;
      text-decoration: none;
      font-weight: 600;
    }

    .register-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  returnUrl = '/home';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Se l'utente è già loggato, redirect
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

    // Ottieni l'URL di ritorno dai query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials: LoginCredentials = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: (success: boolean) => {
          this.isLoading = false;
          
          if (success) {
            console.log('Login riuscito!');
            // Redirect all'URL originale o alla home
            this.router.navigateByUrl(this.returnUrl);
          } else {
            this.errorMessage = 'Username o password non corretti';
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Errore durante il login:', error);
          
          if (error.status === 401) {
            this.errorMessage = 'Username o password non corretti';
          } else if (error.status === 0) {
            this.errorMessage = 'Errore di connessione. Verifica che Keycloak sia attivo.';
          } else {
            this.errorMessage = 'Errore durante il login. Riprova più tardi.';
          }
        }
      });
    } else {
      // Marca tutti i campi come touched per mostrare gli errori
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}