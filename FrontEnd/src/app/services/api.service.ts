// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Utente {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  sesso: string;
  tipoUtente: string;
}

export interface Risorsa {
  id: number;
  titolo: string;
  autore: string;
  isbn: string;
  tipo: string;
  editore: string;
  annoPubblicazione: number;
  copieDisponibili: number;
  copieTotali: number;
  stato: string;
  descrizione: string;
}

export interface TipologiaTessera {
  id: number;
  nome: string;
  descrizione: string;
  creditiMensili: number;
  durataPrestitoGiorni: number;
  costoAnnuale: number;
}

export interface RegistrationData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  sesso: string;
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8081';
  private jwtToken: string | null = null;

  constructor(private http: HttpClient) {
    this.jwtToken = localStorage.getItem('access_token'); // Cambiato da jwt_token
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Prendi sempre il token più recente dal localStorage
    const currentToken = localStorage.getItem('access_token');
    if (currentToken) {
      headers = headers.set('Authorization', `Bearer ${currentToken}`);
    }
    
    return headers;
  }

  setToken(token: string): void {
    this.jwtToken = token;
    localStorage.setItem('access_token', token); // Cambiato da jwt_token
  }

  clearToken(): void {
    this.jwtToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // UTENTI
  getAllUsers(): Observable<Utente[]> {
    return this.http.get<Utente[]>(`${this.baseUrl}/api/utenti/all`);
  }

  getCurrentUser(): Observable<Utente> {
    return this.http.get<Utente>(`${this.baseUrl}/api/utenti`, {
      headers: this.getHeaders()
    });
  }

  getUserCredits(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/utenti/crediti`, {
      headers: this.getHeaders()
    });
  }

  registerUser(userData: RegistrationData): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/registrazione`, userData);
  }

  // RISORSE/LIBRI
  getAllRisorse(): Observable<Risorsa[]> {
    return this.http.get<Risorsa[]>(`${this.baseUrl}/api/risorse`);
  }

  getRisorsaById(id: number): Observable<Risorsa> {
    return this.http.get<Risorsa>(`${this.baseUrl}/api/risorse/${id}`);
  }

  searchRisorseByTitle(titolo: string): Observable<Risorsa[]> {
    return this.http.get<Risorsa[]>(`${this.baseUrl}/api/risorse/search?titolo=${titolo}`);
  }

  createRisorsa(risorsa: Partial<Risorsa>): Observable<Risorsa> {
    return this.http.post<Risorsa>(`${this.baseUrl}/api/risorse`, risorsa, {
      headers: this.getHeaders()
    });
  }

  // TIPOLOGIE TESSERA
  getAllTipologie(): Observable<TipologiaTessera[]> {
    return this.http.get<TipologiaTessera[]>(`${this.baseUrl}/api/tessere/tipologie`);
  }

  createTipologia(tipologia: Partial<TipologiaTessera>): Observable<TipologiaTessera> {
    return this.http.post<TipologiaTessera>(`${this.baseUrl}/api/tessere/tipologie`, tipologia, {
      headers: this.getHeaders()
    });
  }

  // TESSERE UTENTE
  getUserTessere(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/tessere/utente`, {
      headers: this.getHeaders()
    });
  }

  createTessera(tipologiaId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/tessere`, 
      { tipologia: { id: tipologiaId } }, 
      { headers: this.getHeaders() }
    );
  }

  // PRESTITI
  getUserPrestiti(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/prestiti/utente`, {
      headers: this.getHeaders()
    });
  }

  createPrestito(risorsaId: number, dataInizio: string, dataScadenza: string): Observable<any> {
    const prestito = {
      risorsa: { id: risorsaId },
      dataInizio: dataInizio,
      dataScadenza: dataScadenza,
      stato: 'ATTIVO'
    };
    
    return this.http.post(`${this.baseUrl}/api/prestiti`, prestito, {
      headers: this.getHeaders()
    });
  }

  // ORDINI
  getAllOrdini(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/ordini`, {
      headers: this.getHeaders()
    });
  }

  getUserOrdini(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/ordini/ordiniUtente`, {
      headers: this.getHeaders()
    });
  }
}