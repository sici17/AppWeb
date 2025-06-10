package services;

import jakarta.persistence.OptimisticLockException;
import repositories.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import support.auth.Utils;
import support.exceptions.*;

import entities.*;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TesseraLibreriaService {

    private final TesseraLibreriaRepository tesseraLibreriaRepository;
    private final UtenteRepository utenteRepository;
    private final TipologiaTesseraRepository tipologiaTesseraRepository;

    @Autowired
    public TesseraLibreriaService(TesseraLibreriaRepository tesseraLibreriaRepository, UtenteRepository utenteRepository, TipologiaTesseraRepository tipologiaTesseraRepository) {
        this.tesseraLibreriaRepository = tesseraLibreriaRepository;
        this.utenteRepository = utenteRepository;
        this.tipologiaTesseraRepository = tipologiaTesseraRepository;
    }
    
    
    
    
    

    @Transactional(readOnly = true)
    public List<TesseraLibreria> getAllTessere() {
        return tesseraLibreriaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public TesseraLibreria getTesseraById(int id) throws TesseraNotFoundException {
        return tesseraLibreriaRepository.findById(id).orElseThrow(TesseraNotFoundException::new);
    }

    @Transactional
    public TesseraLibreria createTessera(TesseraLibreria tessera) throws UserNotFoundException, TipologiaNotFoundException, TipologiaAlreadyExistException {
        System.out.println("=== SERVICE: CREAZIONE TESSERA CON AUTORIZZAZIONE ===");
        
        // 🔧 Ottieni l'utente tramite email invece di ID generato
        Utente utente;
        try {
            String email = Utils.getEmail();
            System.out.println("🔍 Ricerca utente per email dal JWT: " + email);
            
            utente = utenteRepository.findByEmail(email).orElseThrow(() -> {
                System.err.println("❌ Utente non trovato con email: " + email);
                return new UserNotFoundException();
            });
            
            System.out.println("✅ Utente trovato nel database:");
            System.out.println("   ID: " + utente.getId());
            System.out.println("   Nome: " + utente.getNome() + " " + utente.getCognome());
            System.out.println("   Email: " + utente.getEmail());
            System.out.println("   Tipo: " + utente.getTipoUtente());
            
        } catch (Exception e) {
            System.err.println("❌ Errore nella ricerca utente: " + e.getMessage());
            throw new UserNotFoundException();
        }
        
        // Verifica che la tipologia esista
        if (tessera.getTipologia() == null || tessera.getTipologia().getId() == 0) {
            System.err.println("Tipologia tessera mancante o ID non valido");
            throw new TipologiaNotFoundException();
        }
        
        int tipologiaId = tessera.getTipologia().getId();
        System.out.println("Tipologia ID richiesta: " + tipologiaId);
        
        TipologiaTessera tipologia = tipologiaTesseraRepository.findById(tipologiaId).orElseThrow(() -> {
            System.err.println("Tipologia non trovata con ID: " + tipologiaId);
            return new TipologiaNotFoundException();
        });
        System.out.println("Tipologia trovata: " + tipologia.getNome());
        
        if (!tipologia.isAccessibileA(utente.getTipoUtente())) {
            System.err.println("ACCESSO NEGATO: L'utente " + utente.getTipoUtente() + 
                             " non può richiedere la tessera " + tipologia.getNome());
            System.err.println("Tipi ammessi: " + tipologia.getDescrizioneTipiAmmessi());
            
            throw new TipologiaAlreadyExistException("Non sei autorizzato a richiedere questa tipologia di tessera. " +
                    "Questa tessera è disponibile per: " + tipologia.getDescrizioneTipiAmmessi());
        }
        
        System.out.println("✅ AUTORIZZAZIONE OK: L'utente può richiedere questa tessera");
        
        // Verifica se l'utente ha già una tessera di questo tipo attiva
        List<TesseraLibreria> tessereEsistenti = tesseraLibreriaRepository.findByUtente(utente);
        boolean haGiaTipologia = tessereEsistenti.stream()
            .anyMatch(t -> t.getTipologia().getId() == tipologiaId && t.getStato() == TesseraLibreria.StatoTessera.ATTIVA);
        
        if (haGiaTipologia) {
            System.err.println("L'utente ha già una tessera attiva di tipo: " + tipologia.getNome());
            throw new TipologiaAlreadyExistException("Hai già una tessera attiva di questo tipo");
        }
        
        // Crea la nuova tessera
        TesseraLibreria nuovaTessera = new TesseraLibreria();
        nuovaTessera.setUtente(utente);
        nuovaTessera.setTipologia(tipologia);
        nuovaTessera.setCreditiRimanenti(tipologia.getCreditiMensili());
        nuovaTessera.setDataEmissione(new Date());
        nuovaTessera.setStato(TesseraLibreria.StatoTessera.ATTIVA);
        nuovaTessera.setRinnovoAutomatico(tipologia.isRinnovoAutomatico());

        System.out.println("Creazione tessera autorizzata:");
        System.out.println("- Utente: " + utente.getNome() + " " + utente.getCognome() + " (" + utente.getTipoUtente() + ")");
        System.out.println("- Tipologia: " + tipologia.getNome());
        System.out.println("- Crediti iniziali: " + tipologia.getCreditiMensili());
        
        TesseraLibreria tesseraSalvata = tesseraLibreriaRepository.save(nuovaTessera);
        System.out.println("Tessera salvata con ID: " + tesseraSalvata.getId());
        System.out.println("Numero tessera generato: " + tesseraSalvata.getNumeroTessera());
        
        return tesseraSalvata;
    }

    @Transactional
    public void deleteTessera(int id) {
        tesseraLibreriaRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<TesseraLibreria> getTessereByUtente(Utente utente) {
        return tesseraLibreriaRepository.findByUtente(utente);
    }
    
    @Transactional
    public TesseraLibreria saveTessera(TesseraLibreria tessera) {
        System.out.println("=== SALVATAGGIO TESSERA ===");
        System.out.println("ID: " + tessera.getId());
        System.out.println("Stato: " + tessera.getStato());
        System.out.println("Utente: " + tessera.getUtente().getNome());
        
        return tesseraLibreriaRepository.save(tessera);
    }

    @Transactional(readOnly = true)
    public List<TesseraLibreria> getTessereUtenteConCrediti(Utente utente) {
        return tesseraLibreriaRepository.findByUtenteAndCreditiRimanentiGreaterThanZero(utente);
    }

    @Transactional(rollbackFor = OptimisticLockException.class)
    public void scalaCredito(int id) throws UserNotFoundException, InsufficientCreditsException {
        // Questo metodo può continuare a usare l'ID del database perché viene chiamato 
        // dal PrestitoService che ha già l'utente
        Utente u = utenteRepository.findById(id).orElseThrow(UserNotFoundException::new);
        List<TesseraLibreria> tessereAttive = tesseraLibreriaRepository.findByUtenteAndCreditiRimanentiGreaterThanZero(u);
        if (tessereAttive.isEmpty()) throw new InsufficientCreditsException();

        TesseraLibreria daScalare = tessereAttive.get(0);
        daScalare.setCreditiRimanenti(daScalare.getCreditiRimanenti()-1);
        tesseraLibreriaRepository.save(daScalare);
    }

@Transactional
public TesseraLibreria richiedeTessera(TipologiaTessera tipologia, String noteRichiesta) 
        throws UserNotFoundException, TipologiaNotFoundException, TipologiaAlreadyExistException {
    
    System.out.println("=== RICHIESTA TESSERA (NON CREAZIONE DIRETTA) ===");
    
    // 🔧 CAMBIAMENTO PRINCIPALE: Usa email invece di ID generato
    try {
        String email = Utils.getEmail();
        System.out.println("🔍 Ricerca utente per email dal JWT: " + email);
        
        // Cerca l'utente nel database per email
        Utente utente = utenteRepository.findByEmail(email).orElseThrow(() -> {
            System.err.println(" Utente non trovato con email: " + email);
            System.err.println(" Possibili cause:");
            System.err.println("   1. L'utente non è stato registrato nel database");
            System.err.println("   2. L'email nel JWT non corrisponde a quella nel DB");
            System.err.println("   3. L'utente è stato eliminato dal database");
            return new UserNotFoundException();
        });
        
        System.out.println("✅ Utente trovato nel database:");
        System.out.println("   ID: " + utente.getId());
        System.out.println("   Nome: " + utente.getNome() + " " + utente.getCognome());
        System.out.println("   Email: " + utente.getEmail());
        System.out.println("   Tipo: " + utente.getTipoUtente());
        
        // Verifica autorizzazione
        if (!tipologia.isAccessibileA(utente.getTipoUtente())) {
            System.err.println("ACCESSO NEGATO: L'utente " + utente.getTipoUtente() + 
                             " non può richiedere la tessera " + tipologia.getNome());
            throw new TipologiaAlreadyExistException("Non autorizzato per questa tipologia");
        }
        
        // Verifica se ha già una richiesta pending o tessera attiva
        List<TesseraLibreria> tessereEsistenti = tesseraLibreriaRepository.findByUtente(utente);
        boolean haGiaRichiesta = tessereEsistenti.stream().anyMatch(t -> 
            t.getTipologia().getId() == tipologia.getId() && 
            (t.getStato() == TesseraLibreria.StatoTessera.RICHIESTA_PENDING ||
             t.getStato() == TesseraLibreria.StatoTessera.ATTIVA)
        );
        
        if (haGiaRichiesta) {
            System.err.println("❌ L'utente ha già una richiesta/tessera per questa tipologia");
            throw new TipologiaAlreadyExistException("Hai già una richiesta in corso o una tessera attiva");
        }
        
        // Crea RICHIESTA (non tessera attiva)
        TesseraLibreria richiestaTessera = new TesseraLibreria();
        richiestaTessera.setUtente(utente);
        richiestaTessera.setTipologia(tipologia);
        richiestaTessera.setStato(TesseraLibreria.StatoTessera.RICHIESTA_PENDING); // 🎯 PENDING
        richiestaTessera.setDataRichiesta(new Date());
        richiestaTessera.setNoteRichiesta(noteRichiesta);
        richiestaTessera.setCreditiRimanenti(0); // Nessun credito finché non approvata
        
        TesseraLibreria richiestaSalvata = tesseraLibreriaRepository.save(richiestaTessera);
        
        System.out.println("✅ RICHIESTA TESSERA CREATA:");
        System.out.println("   ID: " + richiestaSalvata.getId());
        System.out.println("   Stato: " + richiestaSalvata.getStato());
        System.out.println("   Utente: " + utente.getNome() + " " + utente.getCognome());
        System.out.println("   Tipologia: " + tipologia.getNome());
        
        return richiestaSalvata;
        
    } catch (Exception e) {
        System.err.println("❌ Errore durante richiesta tessera: " + e.getMessage());
        e.printStackTrace();
        
        if (e instanceof UserNotFoundException || 
            e instanceof TipologiaAlreadyExistException) {
            throw e;
        }
        
        throw new UserNotFoundException(); // Fallback
    }
}

    // Metodi per admin
    @SuppressWarnings("deprecation")
    @Transactional
    public TesseraLibreria approvaTessera(int richiestaId, String noteAdmin) 
            throws TesseraNotFoundException {
        
        System.out.println("=== SERVICE: APPROVAZIONE TESSERA ===");
        System.out.println("ID Richiesta: " + richiestaId);
        System.out.println("Note admin: " + noteAdmin);
        
        TesseraLibreria richiesta = tesseraLibreriaRepository.findById(richiestaId)
                .orElseThrow(() -> {
                    System.err.println("❌ Richiesta non trovata con ID: " + richiestaId);
                    return new TesseraNotFoundException();
                });
        
        System.out.println("Richiesta trovata:");
        System.out.println("- Stato attuale: " + richiesta.getStato());
        System.out.println("- Utente: " + richiesta.getUtente().getNome() + " " + richiesta.getUtente().getCognome());
        System.out.println("- Tipologia: " + richiesta.getTipologia().getNome());
        
        if (richiesta.getStato() != TesseraLibreria.StatoTessera.RICHIESTA_PENDING) {
            String errorMsg = "La richiesta deve essere in stato PENDING. Stato attuale: " + richiesta.getStato();
            System.err.println("❌ " + errorMsg);
            throw new IllegalStateException(errorMsg);
        }
        
        try {
            // Approva e attiva la tessera
            richiesta.setStato(TesseraLibreria.StatoTessera.ATTIVA);
            richiesta.setDataApprovazione(new Date());
            richiesta.setAdminApprovatoreId(Utils.getId());
            richiesta.setNoteAdmin(noteAdmin);
            richiesta.setCreditiRimanenti(richiesta.getTipologia().getCreditiMensili());
            
            // Imposta data emissione se non già impostata
            if (richiesta.getDataEmissione() == null) {
                richiesta.setDataEmissione(new Date());
            }
            
            // Calcola data scadenza (1 anno dalla data di approvazione)
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.YEAR, 1);
            richiesta.setDataScadenza(cal.getTime());
            
            // Genera numero tessera se non già presente
            if (richiesta.getNumeroTessera() == null || richiesta.getNumeroTessera().isEmpty()) {
                // Il numero tessera viene generato automaticamente dal @PrePersist
                // Ma possiamo forzarlo qui se necessario
                richiesta.setNumeroTessera(generaNumeroTessera());
            }
            
            System.out.println("=== AGGIORNAMENTO TESSERA ===");
            System.out.println("Nuovo stato: " + richiesta.getStato());
            System.out.println("Crediti assegnati: " + richiesta.getCreditiRimanenti());
            System.out.println("Data scadenza: " + richiesta.getDataScadenza());
            System.out.println("Numero tessera: " + richiesta.getNumeroTessera());
            
            TesseraLibreria tesseraSalvata = tesseraLibreriaRepository.save(richiesta);
            
            System.out.println("✅ TESSERA APPROVATA E SALVATA:");
            System.out.println("   ID: " + tesseraSalvata.getId());
            System.out.println("   Stato: " + tesseraSalvata.getStato());
            System.out.println("   Numero: " + tesseraSalvata.getNumeroTessera());
            System.out.println("   Crediti: " + tesseraSalvata.getCreditiRimanenti());
            
            return tesseraSalvata;
            
        } catch (Exception e) {
            System.err.println(" Errore durante approvazione tessera: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Errore approvazione tessera", e);
        }
    }
    
    
    @SuppressWarnings("deprecation")
    @Transactional
    public TesseraLibreria rifiutaTessera(int richiestaId, String motivoRifiuto) 
            throws TesseraNotFoundException {
        
        System.out.println("=== SERVICE: RIFIUTO TESSERA ===");
        System.out.println("ID Richiesta: " + richiestaId);
        System.out.println("Motivo rifiuto: " + motivoRifiuto);
        
        TesseraLibreria richiesta = tesseraLibreriaRepository.findById(richiestaId)
                .orElseThrow(() -> {
                    System.err.println("❌ Richiesta non trovata con ID: " + richiestaId);
                    return new TesseraNotFoundException();
                });
        
        if (richiesta.getStato() != TesseraLibreria.StatoTessera.RICHIESTA_PENDING) {
            String errorMsg = "La richiesta deve essere in stato PENDING. Stato attuale: " + richiesta.getStato();
            System.err.println(" " + errorMsg);
            throw new IllegalStateException(errorMsg);
        }
        
        try {
            richiesta.setStato(TesseraLibreria.StatoTessera.RICHIESTA_RIFIUTATA);
            richiesta.setDataApprovazione(new Date());
            richiesta.setAdminApprovatoreId(Utils.getId());
            richiesta.setNoteAdmin(motivoRifiuto);
            
            TesseraLibreria tesseraSalvata = tesseraLibreriaRepository.save(richiesta);
            
            System.out.println(" TESSERA RIFIUTATA:");
            System.out.println("   ID: " + tesseraSalvata.getId());
            System.out.println("   Stato: " + tesseraSalvata.getStato());
            System.out.println("   Motivo: " + motivoRifiuto);
            
            return tesseraSalvata;
            
        } catch (Exception e) {
            System.err.println("❌ Errore durante rifiuto tessera: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Errore rifiuto tessera", e);
        }
    }

    
    @Transactional(readOnly = true)
    public List<TesseraLibreria> getRichiesteInAttesa() {
        try {
            System.out.println("=== SERVICE: CARICAMENTO RICHIESTE IN ATTESA ===");
            
            List<TesseraLibreria> richieste = tesseraLibreriaRepository.findRichiesteInAttesa();
            
            System.out.println("Richieste trovate nel DB: " + richieste.size());
            
            // Force loading delle relazioni lazy per evitare errori di serializzazione
            for (TesseraLibreria richiesta : richieste) {
                // Forza il caricamento di utente e tipologia
                richiesta.getUtente().getNome(); // trigger lazy loading
                richiesta.getTipologia().getNome(); // trigger lazy loading
                
                System.out.println("- ID: " + richiesta.getId() + 
                                 ", Utente: " + richiesta.getUtente().getNome() + " " + richiesta.getUtente().getCognome() +
                                 ", Tipologia: " + richiesta.getTipologia().getNome() +
                                 ", Stato: " + richiesta.getStato() +
                                 ", Data: " + richiesta.getDataRichiesta());
            }
            
            return richieste;
            
        } catch (Exception e) {
            System.err.println("❌ Errore nel caricamento richieste in attesa: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Errore caricamento richieste", e);
        }
    }

    
    
    private String generaNumeroTessera() {
        int anno = Calendar.getInstance().get(Calendar.YEAR);
        int random = (int) (Math.random() * 9999);
        return String.format("LIB%d%04d", anno, random);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatisticheAdmin() {
        System.out.println("=== SERVICE: CARICAMENTO STATISTICHE ADMIN ===");
        
        Map<String, Object> stats = new HashMap<>();
        
        try {
            long tessereAttive = tesseraLibreriaRepository.countTessereAttive();
            long tessereSospese = tesseraLibreriaRepository.countTessereSospese();
            long tessereRevocate = tesseraLibreriaRepository.countTessereRevocate();
            long richiesteInAttesa = tesseraLibreriaRepository.countRichiesteInAttesa();
            
            stats.put("tessereAttive", tessereAttive);
            stats.put("tessereSospese", tessereSospese);
            stats.put("tessereRevocate", tessereRevocate);
            stats.put("richiesteInAttesa", richiesteInAttesa);
            stats.put("totale", tessereAttive + tessereSospese + tessereRevocate);
            
            System.out.println("Statistiche generate: " + stats);
            
            return stats;
            
        } catch (Exception e) {
            System.err.println("❌ Errore caricamento statistiche: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Errore caricamento statistiche", e);
        }
    }
    
    
    
    @Transactional(readOnly = true)
    public List<TesseraLibreria> getTessereInScadenza(int giorni) {
        System.out.println("=== SERVICE: CONTROLLO TESSERE IN SCADENZA ===");
        
        try {
            List<TesseraLibreria> tessereAttive = tesseraLibreriaRepository.findTessereAttive();
            Date dataLimite = new Date(System.currentTimeMillis() + (giorni * 24L * 60 * 60 * 1000));
            
            List<TesseraLibreria> tessereInScadenza = tessereAttive.stream()
                .filter(t -> t.getDataScadenza() != null && t.getDataScadenza().before(dataLimite))
                .sorted((t1, t2) -> t1.getDataScadenza().compareTo(t2.getDataScadenza()))
                .toList();
            
            System.out.println("Tessere in scadenza entro " + giorni + " giorni: " + tessereInScadenza.size());
            
            return tessereInScadenza;
            
        } catch (Exception e) {
            System.err.println(" Errore controllo tessere in scadenza: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    
}