// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-brand">
        <a routerLink="/home">🏛️ Biblioteca</a>
      </div>
      
      <div class="nav-links">
        <a routerLink="/home">Home</a>
        <a routerLink="/risorse">Catalogo</a>
        <a routerLink="/registrazione">Registrati</a>
        <a routerLink="/login" class="btn-login">Accedi</a>
      </div>
    </nav>
    
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar {
      background: #343a40;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .nav-brand a {
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      text-decoration: none;
    }
    
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .nav-links a {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    
    .nav-links a:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .btn-login {
      background-color: #007bff !important;
      color: white !important;
    }
    
    .main-content {
      min-height: calc(100vh - 70px);
      background-color: #f8f9fa;
    }
  `]
})
export class AppComponent {
  title = 'biblioteca-frontend';
}