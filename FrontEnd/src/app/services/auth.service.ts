// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserInfo {
  sub: string;
  preferred_username: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  realm_access?: {
    roles: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Per ora, implementazione base
  }

  login(credentials: LoginCredentials): Observable<boolean> {
    // Implementazione semplificata per test
    console.log('Login attempt:', credentials);
    
    // Simula un login riuscito per test
    const mockUser: UserInfo = {
      sub: '123',
      preferred_username: credentials.username,
      email: credentials.username + '@test.com',
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      realm_access: {
        roles: ['utente']
      }
    };
    
    this.currentUserSubject.next(mockUser);
    localStorage.setItem('access_token', 'mock-token');
    
    return of(true);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.realm_access?.roles?.includes(role) || false;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isUser(): boolean {
    return this.hasRole('utente');
  }
}