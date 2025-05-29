// src/app/services/api.service.ts - VERSIONE FINALE PULITA
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface CreatePrestitoRequest {
  risorsa: { id: number };
  dataInizio: string; // formato YYYY-MM-DD
  dataScadenza: string; // formato YYYY-MM-DD
  stato: 'ATTIVO' | 'RESTITUITO' | 'SCADUTO' | 'RINNOVATO' | 'SMARRITO' | 'DANNEGGIATO';
}

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
  stato: 'ATTIVA' | 'SCADUTA' | 'SOSPESA' | 'REVOCATA' | 'BLOCCATA' | 
         'RICHIESTA_PENDING' | 'RICHIESTA_APPROVATA' | 'RICHIESTA_RIFIUTATA'; // 🆕 NUOVI STATI
  rinnovoAutomatico: boolean;
  
  // 🆕 NUOVI CAMPI PER LE RICHIESTE
  dataRichiesta?: string;          // Data quando è stata fatta la richiesta
  dataApprovazione?: string;       // Data approvazione/rifiuto
  adminApprovatoreId?: number;     // ID dell'admin che ha approvato/rifiutato
  noteRichiesta?: string;          // Note inserite dall'utente
  noteAdmin?: string;              // Note inserite dall'admin
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
  
  getTipologieDisponibili(): Observable<TipologiaTessera[]> {
      return this.http.get<TipologiaTessera[]>(`${this.baseUrl}/api/tessere/tipologie/disponibili`);
    }
  

  // TESSERE UTENTE
  getUserTessere(): Observable<TesseraLibreria[]> {
    return this.http.get<TesseraLibreria[]>(`${this.baseUrl}/api/tessere/utente`);
  }

  // ADMIN: Ottieni tutte le tessere
  getAllTessere(): Observable<TesseraLibreria[]> {
    return this.http.get<TesseraLibreria[]>(`${this.baseUrl}/api/tessere`);
  }

  // ADMIN: Sospendi tessera
  sospendiTessera(tesseraId: number, motivo?: string): Observable<any> {
    const body = motivo ? { motivo } : {};
    console.log(`🚫 Sospensione tessera ID ${tesseraId} con motivo:`, motivo);
    
    return this.http.put(`${this.baseUrl}/api/tessere/admin/${tesseraId}/sospendi`, body).pipe(
      tap(response => {
        console.log('🚫 Risposta sospensione:', response);
      }),
      catchError(error => {
        console.error('❌ Errore sospensione tessera:', error);
        return throwError(() => error);
      })
    );
  }

  riattivaTessera(tesseraId: number, note?: string): Observable<any> {
    const body = note ? { note } : {};
    console.log(`✅ Riattivazione tessera ID ${tesseraId} con note:`, note);
    
    return this.http.put(`${this.baseUrl}/api/tessere/admin/${tesseraId}/riattiva`, body).pipe(
      tap(response => {
        console.log('✅ Risposta riattivazione:', response);
      }),
      catchError(error => {
        console.error('❌ Errore riattivazione tessera:', error);
        return throwError(() => error);
      })
    );
  }


  cambiaStatoTessera(tesseraId: number, nuovoStato: string, motivo?: string): Observable<any> {
    const body = { stato: nuovoStato, motivo: motivo || '' };
    console.log(`🔄 Cambio stato tessera ID ${tesseraId} a ${nuovoStato}`);
    
    return this.http.put(`${this.baseUrl}/api/tessere/admin/${tesseraId}/stato`, body).pipe(
      tap(response => {
        console.log('🔄 Risposta cambio stato:', response);
      }),
      catchError(error => {
        console.error('❌ Errore cambio stato tessera:', error);
        return throwError(() => error);
      })
    );
  }

  getUserTessereWithCredits(): Observable<TesseraLibreria[]> {
    return this.http.get<TesseraLibreria[]>(`${this.baseUrl}/api/tessere/utente/concrediti`);
  }

  // Cambia da createTessera a richiedeTessera
  richiedeTessera(tipologiaId: number, note?: string): Observable<any> {
    const request = {
      tipologiaId: tipologiaId,
      note: note || ''
    };
    
    return this.http.post(`${this.baseUrl}/api/tessere/richiedi`, request);
  }

  getRichiesteInAttesa(): Observable<TesseraLibreria[]> {
    return this.http.get<TesseraLibreria[]>(`${this.baseUrl}/api/tessere/admin/richieste`).pipe(
      tap(richieste => {
        console.log('📋 Richieste in attesa caricate:', richieste.length);
        richieste.forEach(r => {
          console.log(`- ${r.utente.nome} ${r.utente.cognome}: ${r.tipologia.nome} (${r.stato})`);
        });
      }),
      catchError(error => {
        console.error('❌ Errore caricamento richieste in attesa:', error);
        return throwError(() => error);
      })
    );
  }
  approvaTessera(richiestaId: number, note?: string): Observable<any> {
    const body = note ? { note } : {};
    console.log(`✅ Approvazione tessera ID ${richiestaId} con note:`, note);
    
    return this.http.put(`${this.baseUrl}/api/tessere/admin/${richiestaId}/approva`, body).pipe(
      tap(response => {
        console.log('✅ Risposta approvazione:', response);
      }),
      catchError(error => {
        console.error('❌ Errore approvazione tessera:', error);
        return throwError(() => error);
      })
    );
  }

  rifiutaTessera(richiestaId: number, motivo: string): Observable<any> {
    console.log(`❌ Rifiuto tessera ID ${richiestaId} con motivo:`, motivo);
    
    return this.http.put(`${this.baseUrl}/api/tessere/admin/${richiestaId}/rifiuta`, { motivo }).pipe(
      tap(response => {
        console.log('❌ Risposta rifiuto:', response);
      }),
      catchError(error => {
        console.error('❌ Errore rifiuto tessera:', error);
        return throwError(() => error);
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

  createPrestito(prestitoData: CreatePrestitoRequest): Observable<Prestito> {
    console.log('📅 Creazione prestito:', prestitoData);
    
    // Assicurati che le date siano nel formato corretto
    const payload = {
      ...prestitoData,
      dataInizio: prestitoData.dataInizio,
      dataScadenza: prestitoData.dataScadenza
    };
    
    console.log('📤 Payload inviato al backend:', payload);
    
    return this.http.post<Prestito>(`${this.baseUrl}/api/prestiti`, payload).pipe(
      tap(prestito => {
        console.log('✅ Prestito creato:', prestito);
      }),
      catchError(error => {
        console.error('❌ Errore creazione prestito:', error);
        
        // Log dettagliato dell'errore
        if (error.status) {
          console.error('Status:', error.status);
          console.error('Error body:', error.error);
          console.error('Headers:', error.headers);
        }
        
        return throwError(() => error);
      })
    );
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

  // TEST METHODS
  testPublicEndpoint(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/test/public`);
  }

  testAuthDebug(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/test/auth-debug`);
  }

  testProtectedEndpoint(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/test/protected`);
  }

  testDirectCall(): Observable<any> {
    const token = localStorage.getItem('access_token');
    console.log('🧪 Test diretto senza interceptor');
    console.log('🎫 Token dal localStorage:', !!token);
    
    if (!token) {
      return throwError(() => new Error('No token in localStorage'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    console.log('📤 Headers creati direttamente:', headers.keys());
    console.log('📤 Authorization header:', headers.get('Authorization')?.substring(0, 50) + '...');
    
    return this.http.get(`${this.baseUrl}/api/test/jwt-validation`, { headers }).pipe(
      tap(response => {
        console.log('✅ Test diretto riuscito:', response);
      }),
      catchError(error => {
        console.error('❌ Test diretto fallito:', error);
        return throwError(() => error);
      })
    );
  }

  testAuthFlow(): void {
    console.log('🧪 === TEST FLOW AUTENTICAZIONE ===');
    
    this.testPublicEndpoint().subscribe({
      next: (result) => console.log('✅ Pubblico OK:', result),
      error: (error) => console.error('❌ Pubblico ERRORE:', error)
    });
    
    this.testAuthDebug().subscribe({
      next: (result) => {
        console.log('✅ Debug auth risultato:', result);
        
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
  
  
  getTesseraById(tesseraId: number): Observable<TesseraLibreria> {
    return this.http.get<TesseraLibreria>(`${this.baseUrl}/api/tessere/${tesseraId}`).pipe(
      tap(tessera => {
        console.log('🎫 Tessera caricata:', tessera);
      }),
      catchError(error => {
        console.error('❌ Errore caricamento tessera:', error);
        return throwError(() => error);
      })
    );
  }
  
  
  
  testAdminEndpoints(): Observable<any> {
    console.log('🧪 === TEST ADMIN ENDPOINTS ===');
    
    // Test endpoint tessere admin
    return this.http.get(`${this.baseUrl}/api/tessere`).pipe(
      tap(response => {
        console.log('✅ Endpoint admin tessere funzionante:', response);
      }),
      catchError(error => {
        console.error('❌ Errore endpoint admin tessere:', error);
        return throwError(() => error);
      })
    );
  }
  
  
  
  checkAdminPermissions(): Observable<any> {
    console.log('🔐 === VERIFICA PERMESSI ADMIN ===');
    
    return this.http.get(`${this.baseUrl}/api/test/auth-debug`).pipe(
      tap(response => {
        console.log('🔐 Risposta debug auth:', response);
      }),
      catchError(error => {
        console.error('❌ Errore verifica permessi:', error);
        return throwError(() => error);
      })
    );
  }
  
}