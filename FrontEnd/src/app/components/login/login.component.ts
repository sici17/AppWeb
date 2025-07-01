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
    <div class="container">
      <div class="login-box">
        <h1>Accedi alla Biblioteca</h1>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="username">Username:</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username"
              placeholder="Inserisci username">
            @if (loginForm.get('username')?.invalid && loginForm.get('username')?.touched) {
              <div class="error-field">Username richiesto</div>
            }
          </div>

          <div class="field">
            <label for="password">Password:</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              placeholder="Inserisci password">
            @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
              <div class="error-field">Password richiesta</div>
            }
          </div>

          <button 
            type="submit" 
            [disabled]="loginForm.invalid || isLoading">
            @if (isLoading) {
              Accesso in corso...
            } @else {
              Accedi
            }
          </button>

          @if (errorMessage) {
            <div class="error">{{ errorMessage }}</div>
          }
        </form>

        <div class="register-link">
          <p>Non hai un account? <a href="/registrazione">Registrati qui</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .login-box {
      background: white;
      border: 1px solid #ccc;
      padding: 30px;
      width: 100%;
      max-width: 400px;
    }

    h1 {
      text-align: center;
      margin: 0 0 30px 0;
      font-size: 24px;
      color: #333;
    }
    
    .field {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
    }
    
    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      box-sizing: border-box;
      font-size: 14px;
    }

    input:focus {
      outline: none;
      border-color: #666;
    }

    button {
      width: 100%;
      padding: 12px;
      border: 1px solid #ccc;
      background: white;
      cursor: pointer;
      margin-top: 10px;
      font-size: 16px;
      font-weight: bold;
    }
    
    button:hover:not(:disabled) {
      background: #f0f0f0;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #f8f8f8;
    }

    .error-field {
      color: #d00;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 10px;
      margin-top: 15px;
      border: 1px solid #f5c6cb;
      text-align: center;
    }

    .register-link {
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .register-link p {
      margin: 0;
      color: #666;
    }

    .register-link a {
      color: #333;
      text-decoration: underline;
    }

    .register-link a:hover {
      color: #000;
    }

    @media (max-width: 500px) {
      .container {
        padding: 10px;
      }

      .login-box {
        padding: 20px;
      }

      h1 {
        font-size: 20px;
      }
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
    // Se già loggato, redirect
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

    // URL di ritorno dai query params
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
            console.log('Login riuscito');
            this.router.navigateByUrl(this.returnUrl);
          } else {
            this.errorMessage = 'Username o password non corretti';
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Errore login:', error);
          
          if (error.status === 401) {
            this.errorMessage = 'Username o password non corretti';
          } else if (error.status === 0) {
            this.errorMessage = 'Errore di connessione. Verifica che il sistema sia attivo.';
          } else {
            this.errorMessage = 'Errore durante il login. Riprova più tardi.';
          }
        }
      });
    } else {
      // mostra errori validazione
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}