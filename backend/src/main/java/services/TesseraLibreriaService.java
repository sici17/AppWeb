package services;

import jakarta.persistence.OptimisticLockException;
import repositories.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import support.auth.Utils;
import support.exceptions.*;

import entities.*;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

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
        
        // Ottieni l'utente dal token JWT
        int userId = Utils.getId();
        System.out.println("User ID dal token: " + userId);
        
        Utente utente = utenteRepository.findById(userId).orElseThrow(() -> {
            System.err.println("Utente non trovato con ID: " + userId);
            return new UserNotFoundException();
        });
        System.out.println("Utente trovato: " + utente.getNome() + " " + utente.getCognome());
        System.out.println("Tipo utente: " + utente.getTipoUtente());
        
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
        
        // 🔒 NUOVO: CONTROLLO AUTORIZZAZIONE TIPO UTENTE
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
    public void scalaCredito(int id) throws UserNotFoundException , InsufficientCreditsException {
        Utente u = utenteRepository.findById(id).orElseThrow(UserNotFoundException::new);
        List<TesseraLibreria> tessereAttive = tesseraLibreriaRepository.findByUtenteAndCreditiRimanentiGreaterThanZero(u);
        if (tessereAttive.isEmpty()) throw new InsufficientCreditsException();

        TesseraLibreria daScalare = tessereAttive.get(0);
        daScalare.setCreditiRimanenti(daScalare.getCreditiRimanenti()-1);
        tesseraLibreriaRepository.save(daScalare);
    }
    
 // In services/TesseraLibreriaService.java
    @Transactional
    public TesseraLibreria richiedeTessera(TipologiaTessera tipologia, String noteRichiesta) 
            throws UserNotFoundException, TipologiaNotFoundException, TipologiaAlreadyExistException {
        
        System.out.println("=== RICHIESTA TESSERA (NON CREAZIONE DIRETTA) ===");
        
        int userId = Utils.getId();
        Utente utente = utenteRepository.findById(userId).orElseThrow(UserNotFoundException::new);
        
        // Verifica autorizzazione
        if (!tipologia.isAccessibileA(utente.getTipoUtente())) {
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
    }

    // Metodi per admin
    @Transactional
    public TesseraLibreria approvaTessera(int richiestaId, String noteAdmin) 
            throws TesseraNotFoundException {
        
        TesseraLibreria richiesta = tesseraLibreriaRepository.findById(richiestaId)
                .orElseThrow(TesseraNotFoundException::new);
        
        if (richiesta.getStato() != TesseraLibreria.StatoTessera.RICHIESTA_PENDING) {
            throw new IllegalStateException("La richiesta deve essere in stato PENDING");
        }
        
        // Approva e attiva
        richiesta.setStato(TesseraLibreria.StatoTessera.ATTIVA);
        richiesta.setDataApprovazione(new Date());
        richiesta.setAdminApprovatoreId(Utils.getId());
        richiesta.setNoteAdmin(noteAdmin);
        richiesta.setCreditiRimanenti(richiesta.getTipologia().getCreditiMensili());
        
        // Calcola data scadenza
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.YEAR, 1);
        richiesta.setDataScadenza(cal.getTime());
        
        System.out.println("✅ TESSERA APPROVATA E ATTIVATA:");
        System.out.println("   ID: " + richiesta.getId());
        System.out.println("   Crediti assegnati: " + richiesta.getCreditiRimanenti());
        
        return tesseraLibreriaRepository.save(richiesta);
    }

    @Transactional
    public TesseraLibreria rifiutaTessera(int richiestaId, String motivoRifiuto) 
            throws TesseraNotFoundException {
        
        TesseraLibreria richiesta = tesseraLibreriaRepository.findById(richiestaId)
                .orElseThrow(TesseraNotFoundException::new);
        
        if (richiesta.getStato() != TesseraLibreria.StatoTessera.RICHIESTA_PENDING) {
            throw new IllegalStateException("La richiesta deve essere in stato PENDING");
        }
        
        richiesta.setStato(TesseraLibreria.StatoTessera.RICHIESTA_RIFIUTATA);
        richiesta.setDataApprovazione(new Date());
        richiesta.setAdminApprovatoreId(Utils.getId());
        richiesta.setNoteAdmin(motivoRifiuto);
        
        System.out.println("❌ TESSERA RIFIUTATA:");
        System.out.println("   ID: " + richiesta.getId());
        System.out.println("   Motivo: " + motivoRifiuto);
        
        return tesseraLibreriaRepository.save(richiesta);
    }
    
    
    
    
    
}