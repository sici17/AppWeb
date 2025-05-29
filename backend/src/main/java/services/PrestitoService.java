// backend/src/main/java/services/PrestitoService.java - VERSIONE MIGLIORATA

package services;

import entities.*;
import repositories.*;
import support.auth.Utils;
import support.exceptions.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@Service
public class PrestitoService {
    private final PrestitoRepository prestitoRepository;
    private final UtenteRepository utenteRepository;
    private final RisorsaRepository risorsaRepository;
    private final UtenteService utenteService;
    private final TesseraLibreriaService tesseraLibreriaService;

    @Autowired
    public PrestitoService(PrestitoRepository prestitoRepository, RisorsaRepository risorsaRepository, 
                          UtenteRepository utenteRepository, UtenteService utenteService, 
                          TesseraLibreriaService tesseraLibreriaService) {
        this.prestitoRepository = prestitoRepository;
        this.risorsaRepository = risorsaRepository;
        this.utenteRepository = utenteRepository;
        this.utenteService = utenteService;
        this.tesseraLibreriaService = tesseraLibreriaService;
    }

    @Transactional(rollbackFor = Exception.class)
    public Prestito create(Prestito prestito) throws RisorsaFullException, RisorsaNotFoundException, 
            PrestitoAlreadyExistsException, UserNotFoundException, InsufficientCreditsException, 
            PrestitoNotValidException {
        
        System.out.println("=== SERVICE: CREAZIONE PRESTITO ===");
        
        // 1. Ottieni e valida l'utente
        int userId = Utils.getId();
        Utente utente = utenteRepository.findById(userId).orElseThrow(() -> {
            System.err.println("❌ Utente non trovato con ID: " + userId);
            return new UserNotFoundException();
        });
        prestito.setUtente(utente);
        System.out.println("✅ Utente trovato: " + utente.getNome() + " " + utente.getCognome());

        // 2. Ottieni e valida la risorsa
        if (prestito.getRisorsa() == null || prestito.getRisorsa().getId() == 0) {
            System.err.println("❌ ID risorsa mancante");
            throw new RisorsaNotFoundException();
        }
        
        int risorsaId = prestito.getRisorsa().getId();
        Risorsa risorsa = risorsaRepository.findById(risorsaId).orElseThrow(() -> {
            System.err.println("❌ Risorsa non trovata con ID: " + risorsaId);
            return new RisorsaNotFoundException();
        });
        prestito.setRisorsa(risorsa);
        System.out.println("✅ Risorsa trovata: " + risorsa.getTitolo());

        // 3. Validazioni temporali
        Date oggi = new Date();
        if (prestito.getDataInizio() == null) {
            System.out.println("⚠️ Data inizio non specificata, uso oggi");
            prestito.setDataInizio(oggi);
        }
        
        // Controlla che la data di inizio non sia nel passato (con tolleranza di 1 giorno)
        Date ieriMezzanotte = new Date(oggi.getTime() - (24 * 60 * 60 * 1000));
        if (prestito.getDataInizio().before(ieriMezzanotte)) {
            System.err.println("❌ Data inizio nel passato: " + prestito.getDataInizio());
            throw new PrestitoNotValidException("Impossibile prenotare per una data passata");
        }
        
        System.out.println("✅ Date valide - Inizio: " + prestito.getDataInizio() + ", Scadenza: " + prestito.getDataScadenza());

        // 4. Controlla prestiti esistenti per la stessa risorsa
        boolean haGiaPrestito = prestitoRepository.existsPrestitoByUtenteAndRisorsaAndStato(
            utente, risorsa, Prestito.StatoPrestito.ATTIVO
        );
        if (haGiaPrestito) {
            System.err.println("❌ L'utente ha già un prestito attivo per questa risorsa");
            throw new PrestitoAlreadyExistsException();
        }

        // 5. Controlla disponibilità risorsa
        if (!isRisorsaDisponibile(risorsa)) {
            System.err.println("❌ Risorsa non disponibile - Copie: " + risorsa.getCopieDisponibili() + 
                             ", Stato: " + risorsa.getStato());
            throw new RisorsaFullException();
        }

        // 6. Controlla crediti utente (solo da tessere ATTIVE)
        int creditiDisponibili = utenteService.creditiUtente();
        if (creditiDisponibili <= 0) {
            System.err.println("❌ Crediti insufficienti: " + creditiDisponibili);
            throw new InsufficientCreditsException();
        }
        System.out.println("✅ Crediti sufficienti: " + creditiDisponibili);

        // 7. Verifica tessere attive
        List<TesseraLibreria> tessereAttive = tesseraLibreriaService.getTessereUtenteConCrediti(utente);
        if (tessereAttive.isEmpty()) {
            System.err.println("❌ Nessuna tessera attiva con crediti");
            throw new InsufficientCreditsException();
        }
        System.out.println("✅ Tessere attive trovate: " + tessereAttive.size());

        // 8. Scala il credito dalle tessere
        try {
            tesseraLibreriaService.scalaCredito(utente.getId());
            System.out.println("✅ Credito scalato dalle tessere");
        } catch (Exception e) {
            System.err.println("❌ Errore durante la scalatura del credito: " + e.getMessage());
            throw new InsufficientCreditsException();
        }

        // 9. Aggiorna disponibilità risorsa
        risorsa.setCopieDisponibili(risorsa.getCopieDisponibili() - 1);
        risorsaRepository.save(risorsa);
        System.out.println("✅ Copie disponibili aggiornate: " + risorsa.getCopieDisponibili());

        // 10. Imposta valori predefiniti se necessario
        if (prestito.getStato() == null) {
            prestito.setStato(Prestito.StatoPrestito.ATTIVO);
        }

        // 11. Salva il prestito
        Prestito prestitoSalvato = prestitoRepository.save(prestito);
        
        System.out.println("✅ === PRESTITO CREATO CON SUCCESSO ===");
        System.out.println("   ID Prestito: " + prestitoSalvato.getId());
        System.out.println("   Utente: " + utente.getNome() + " " + utente.getCognome());
        System.out.println("   Risorsa: " + risorsa.getTitolo());
        System.out.println("   Periodo: " + prestito.getDataInizio() + " → " + prestito.getDataScadenza());
        System.out.println("   Crediti rimanenti utente: " + (creditiDisponibili - 1));
        System.out.println("   Copie risorsa rimanenti: " + risorsa.getCopieDisponibili());
        
        return prestitoSalvato;
    }

    @Transactional(readOnly = true)
    public List<Prestito> findAll() {
        System.out.println("📋 Caricamento tutti i prestiti");
        return prestitoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Prestito> getPrestitiUtente() throws UserNotFoundException {
        int userId = Utils.getId();
        Utente utente = utenteRepository.findById(userId).orElseThrow(UserNotFoundException::new);
        System.out.println("📋 Caricamento prestiti per utente: " + utente.getNome());
        return prestitoRepository.findByUtente(utente);
    }

    @Transactional(readOnly = true)
    public List<Prestito> getPrestitiUtenteDopoData(Date data) throws UserNotFoundException {
        int userId = Utils.getId();
        Utente utente = utenteRepository.findById(userId).orElseThrow(UserNotFoundException::new);
        System.out.println("📋 Caricamento prestiti utente dopo data: " + data);
        return prestitoRepository.findByUtenteAndDataInizioAfter(utente, data);
    }

    @Transactional(readOnly = true)
    public List<Prestito> getPrestitiUtenteFuture() throws UserNotFoundException {
        // Mostro tutti i prestiti compresi quelli della giornata odierna
        LocalDate localDate = LocalDate.now().minusDays(1);
        Date data = Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
        
        System.out.println("📋 Caricamento prestiti futuri (dopo " + data + ")");
        return getPrestitiUtenteDopoData(data);
    }

    // ✅ NUOVO: Metodo per cancellare un prestito
    @Transactional
    public void cancelPrestito(int prestitoId) throws PrestitoNotFoundException, UserNotFoundException {
        System.out.println("🗑️ Cancellazione prestito ID: " + prestitoId);
        
        Prestito prestito = prestitoRepository.findById(prestitoId)
            .orElseThrow(() -> new PrestitoNotFoundException());
        
        // Verifica che sia dell'utente corrente
        int userId = Utils.getId();
        if (prestito.getUtente().getId() != userId) {
            throw new IllegalStateException("Non puoi cancellare prestiti di altri utenti");
        }
        
        // Solo prestiti ATTIVI possono essere cancellati
        if (prestito.getStato() != Prestito.StatoPrestito.ATTIVO) {
            throw new IllegalStateException("Solo i prestiti attivi possono essere cancellati");
        }
        
        // Ripristina disponibilità risorsa
        Risorsa risorsa = prestito.getRisorsa();
        risorsa.setCopieDisponibili(risorsa.getCopieDisponibili() + 1);
        risorsaRepository.save(risorsa);
        
        // TODO: Ripristina credito utente se necessario
        
        // Rimuovi prestito
        prestitoRepository.delete(prestito);
        
        System.out.println("✅ Prestito cancellato e risorsa ripristinata");
    }

    private boolean isRisorsaDisponibile(Risorsa risorsa) {
        boolean disponibile = risorsa.getCopieDisponibili() > 0 && 
                             risorsa.getStato() == Risorsa.StatoRisorsa.DISPONIBILE;
        
        System.out.println("🔍 Controllo disponibilità risorsa '" + risorsa.getTitolo() + "':");
        System.out.println("   Copie disponibili: " + risorsa.getCopieDisponibili());
        System.out.println("   Stato: " + risorsa.getStato());
        System.out.println("   Disponibile: " + disponibile);
        
        return disponibile;
    }
}

