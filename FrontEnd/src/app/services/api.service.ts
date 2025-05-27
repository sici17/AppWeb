// src/app/services/api.service.ts - VERSIONE COMPLETA CORRETTA
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface Utente {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  matricola?: string;
  codiceFiscale?: string;
  telefono?: string;
  sesso: 'MASCHIO' | 'FEMMINA' | 'ALTRO';
  tipoUtente: 'STUDENTE' | 'DOCENTE' | 'PERSONALE' | 'ESTERNO';
}

export interface Risorsa {
  id: number;
  titolo: string;
  autore: string;
  isbn?: string;
  tipo: 'LIBRO' | 'RIVISTA' | 'TESI' | 'POSTAZIONE_PC' | 'DVD' | 'AUDIOLIBRO' | 'EBOOK' | 'MANUALE';
  editore?: string;
  annoPubblicazione: number;
  collocazione?: string;
  copieDisponibili: number;
  copieTotali: number;
  stato: 'DISPONIBILE' | 'PRESTITO' | 'MANUTENZIONE' | 'RITIRATO' | 'PRENOTATO';
  descrizione?: string;
  immagineCopertina?: string;
}

export interface TipologiaTessera {
  id: number;
  nome: string;
  descrizione?: string;
  creditiMensili: number;
  durataPrestitoGiorni: number;
  maxRinnovi: number;
  costoAnnuale: number;
  multaGiornaliera: number;
  maxPrestitiContemporanei: number;
  rinnovoAutomatico: boolean;
  attiva: boolean;
}

export interface TesseraLibreria {
  id: number;
  numeroTessera: string;
  utente: Utente;
  tipologia: TipologiaTessera;
  dataEmissione: string;
  dataScadenza: string;
  creditiRimanenti: number;
  creditiTotaliUsati: number;
  stato: 'ATTIVA' | 'SCADUTA' | 'SOSPESA' | 'REVOCATA' | 'BLOCCATA';
  rinnovoAutomatico: boolean;
}

export interface Prestito {
  id: number;
  utente: Utente;
  risorsa: Risorsa;
  dataInizio: string;
  dataScadenza: string;
  dataRestituzione?: string;
  stato: 'ATTIVO' | 'RESTITUITO' | 'SCADUTO' | 'RINNOVATO' | 'SMARRITO' | 'DANNEGGIATO';
  multa: number;
  rinnovato: boolean;
  numeroRinnovi: number;
  note?: string;
}

export interface Ordine {
  id: number;
  numeroOrdine: string;
  dataCreazione: string;
  dataConsegnaPrevista?: string;
  dataConsegnaEffettiva?: string;
  prezzoTotale: number;
  scontoApplicato: number;
  iva: number;
  statoOrdine: 'CREATO' | 'CONFERMATO' | 'IN_PREPARAZIONE' | 'SPEDITO' | 'CONSEGNATO' | 'ANNULLATO' | 'RIMBORSATO';
  modalitaPagamento?: 'CONTANTI' | 'CARTA_CREDITO' | 'BONIFICO' | 'PAYPAL' | 'CREDITO_UNIVERSITARIO';
  note?: string;
  utente: Utente;
  articoli: any[];
}

export interface RegistrationData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  sesso: 'MASCHIO' | 'FEMMINA' | 'ALTRO';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8081';

  constructor(private http: HttpClient) {}

  // L'interceptor gestirà automaticamente l'aggiunta del token
  // Non abbiamo più bisogno di getHeaders() privato

  // UTENTI
  getAllUsers(): Observable<Utente[]> {
    return this.http.get<Utente[]>(`${this.baseUrl}/api/utenti/all`);
  }

  getCurrentUser(): Observable<Utente> {
    return this.http.get<Utente>(`${this.baseUrl}/api/utenti`);
  }

  getUserCredits(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/utenti/crediti`);
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
    const params = new HttpParams().set('titolo', titolo);
    return this.http.get<Risorsa[]>(`${this.baseUrl}/api/risorse/search`, { params });
  }

  createRisorsa(risorsa: Partial<Risorsa>): Observable<Risorsa> {
    return this.http.post<Risorsa>(`${this.baseUrl}/api/risorse`, risorsa);
  }

  updateRisorsa(id: number, risorsa: Partial<Risorsa>): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/api/risorse/${id}`, risorsa);
  }

  deleteRisorsa(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/api/risorse/${id}`);
  }

  // TIPOLOGIE TESSERA
  getAllTipologie(): Observable<TipologiaTessera[]> {
    return this.http.get<TipologiaTessera[]>(`${this.baseUrl}/api/tessere/tipologie`);
  }

  getTipologiaById(id: number): Observable<TipologiaTessera> {
    return this.http.get<TipologiaTessera>(`${this.baseUrl}/api/tessere/tipologie/${id}`);
  }

  createTipologia(tipologia: Partial<TipologiaTessera>): Observable<TipologiaTessera> {
    return this.http.post<TipologiaTessera>(`${this.baseUrl}/api/tessere/tipologie`, tipologia);
  }

  // TESSERE UTENTE
  getUserTessere(): Observable<TesseraLibreria[]> {
    return this.http.get<TesseraLibreria[]>(`${this.baseUrl}/api/tessere/utente`);
  }

  getUserTessereWithCredits(): Observable<TesseraLibreria[]> {
    return this.http.get<TesseraLibreria[]>(`${this.baseUrl}/api/tessere/utente/concrediti`);
  }

  // METODO CORRETTO PER CREARE TESSERA
  createTessera(tipologiaId: number): Observable<TesseraLibreria> {
    console.log('🎫 Creazione tessera per tipologia ID:', tipologiaId);
    
    const tesseraRequest = {
      tipologia: { 
        id: tipologiaId 
      }
    };
    
    console.log('📤 Payload inviato:', tesseraRequest);
    
    return this.http.post<TesseraLibreria>(`${this.baseUrl}/api/tessere`, tesseraRequest)
      .pipe(
        tap((response: any) => {
          console.log('✅ Tessera creata con successo:', response);
        }),
        catchError((error: any) => {
          console.error('❌ Errore creazione tessera:', error);
          console.error('Status:', error.status);
          console.error('Error body:', error.error);
          throw error;
        })
      );
  }

  deleteTessera(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/tessere/${id}`);
  }

  // PRESTITI
  cancelPrestito(prestitoId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/prestiti/${prestitoId}`);
  }

  getUserPrestiti(): Observable<Prestito[]> {
    return this.http.get<Prestito[]>(`${this.baseUrl}/api/prestiti/utente`);
  }

  getUserPrestitiFuturi(): Observable<Prestito[]> {
    return this.http.get<Prestito[]>(`${this.baseUrl}/api/prestiti/utente/future`);
  }

  getAllPrestiti(): Observable<Prestito[]> {
    return this.http.get<Prestito[]>(`${this.baseUrl}/api/prestiti`);
  }

  createPrestito(prestito: Partial<Prestito>): Observable<Prestito> {
    return this.http.post<Prestito>(`${this.baseUrl}/api/prestiti`, prestito);
  }

  // ORDINI
  getAllOrdini(): Observable<Ordine[]> {
    return this.http.get<Ordine[]>(`${this.baseUrl}/api/ordini`);
  }

  getUserOrdini(): Observable<Ordine[]> {
    return this.http.get<Ordine[]>(`${this.baseUrl}/api/ordini/ordiniUtente`);
  }

  getOrdiniByDateRange(inizio: string, fine: string): Observable<Ordine[]> {
    const params = new HttpParams()
      .set('inizio', inizio)
      .set('fine', fine);
    return this.http.get<Ordine[]>(`${this.baseUrl}/api/ordini/data`, { params });
  }

  deleteOrdine(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/ordini/${id}`);
  }

  // CARRELLO
  getCart(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/cart`);
  }

  addToCart(articoloCarrello: { quantita: number; idArticolo: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/cart/add`, articoloCarrello);
  }

  removeFromCart(articoloCarrello: { quantita: number; idArticolo: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/cart/remove`, articoloCarrello);
  }

  checkout(cart: any): Observable<Ordine> {
    return this.http.post<Ordine>(`${this.baseUrl}/api/cart/checkout`, cart);
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  // Test endpoint pubblico (dovrebbe sempre funzionare)
  testPublicEndpoint(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/test/public`);
  }

  // Test debug autenticazione (dovrebbe funzionare se il token viene inviato)
  testAuthDebug(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/test/auth-debug`);
  }

  // Test endpoint protetto (dovrebbe funzionare solo con JWT valido)
  testProtectedEndpoint(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/test/protected`);
  }

  // Test completo autenticazione
  testAuthFlow(): void {
    console.log('🧪 === TEST FLOW AUTENTICAZIONE ===');
    
    // 1. Test endpoint pubblico
    console.log('🔓 Test endpoint pubblico...');
    this.testPublicEndpoint().subscribe({
      next: (result) => console.log('✅ Pubblico OK:', result),
      error: (error) => console.error('❌ Pubblico ERRORE:', error)
    });
    
    // 2. Test debug auth
    console.log('🔍 Test debug autenticazione...');
    this.testAuthDebug().subscribe({
      next: (result) => {
        console.log('✅ Debug auth risultato:', result);
        
        // 3. Solo se il debug va bene, testa endpoint protetto
        if (result.authenticationType === 'JwtAuthenticationToken') {
          console.log('🔐 JWT riconosciuto! Test endpoint protetto...');
          this.testProtectedEndpoint().subscribe({
            next: (protectedResult) => console.log('✅ Protetto OK:', protectedResult),
            error: (protectedError) => console.error('❌ Protetto ERRORE:', protectedError)
          });
        } else {
          console.log('❌ JWT non riconosciuto dal backend:', result.authenticationType);
        }
      },
      error: (error) => console.error('❌ Debug auth ERRORE:', error)
    });
  }
  
  
  
}