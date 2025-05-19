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
    public PrestitoService(PrestitoRepository prestitoRepository, RisorsaRepository risorsaRepository, UtenteRepository utenteRepository, UtenteService utenteService, TesseraLibreriaService tesseraLibreriaService) {
        this.prestitoRepository = prestitoRepository;
        this.risorsaRepository = risorsaRepository;
        this.utenteRepository = utenteRepository;
        this.utenteService = utenteService;
        this.tesseraLibreriaService = tesseraLibreriaService;
    }

    @Transactional(rollbackFor = Exception.class)
    public Prestito create(Prestito p) throws RisorsaFullException, RisorsaNotFoundException, PrestitoAlreadyExistsException,
            UserNotFoundException, InsufficientCreditsException, PrestitoNotValidException {
        
        //l'utente per cui creo il prestito è quello loggato che prendo dal token jwt (file Utils)
        Utente u = utenteRepository.findById(Utils.getId()).orElseThrow(UserNotFoundException::new);
        p.setUtente(u);

        Risorsa r = risorsaRepository.findById(p.getRisorsa().getId()).orElseThrow(RisorsaNotFoundException::new);
        p.setRisorsa(r);
        
        if(p.getDataInizio().before(new Date())) throw new PrestitoNotValidException("Impossibile prenotare per una data passata");

        if (prestitoRepository.existsPrestitoByUtenteAndRisorsaAndStato(u, r, Prestito.StatoPrestito.ATTIVO))
            throw new PrestitoAlreadyExistsException();
        if (utenteService.creditiUtente() <= 0)
            throw new InsufficientCreditsException();
        if (!risorsaDisponibile(r))
            throw new RisorsaFullException();

        //se non ci sono stati problemi fin'ora allora scalo il credito
        tesseraLibreriaService.scalaCredito(u.getId());
        //solo se riesco a scalare il credito allora salvo il prestito, altrimenti scalaCredito() lancia eccezione e fa rollback correttamente
        
        // Aggiorna disponibilità risorsa
        r.setCopieDisponibili(r.getCopieDisponibili() - 1);
        risorsaRepository.save(r);
        
        return prestitoRepository.save(p);
    }

    @Transactional(readOnly = true)
    public List<Prestito> findAll() {
        return prestitoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Prestito> getPrestitiUtente() throws UserNotFoundException {
        Utente u = utenteRepository.findById(Utils.getId()).orElseThrow(UserNotFoundException::new);
        return prestitoRepository.findByUtente(u);
    }

    @Transactional(readOnly = true)
    public List<Prestito> getPrestitiUtenteDopoData(Date data) throws UserNotFoundException {
        Utente u = utenteRepository.findById(Utils.getId()).orElseThrow(UserNotFoundException::new);
        return prestitoRepository.findByUtenteAndDataInizioAfter(u,data);
    }

    @Transactional(readOnly = true)
    public List<Prestito> getPrestitiUtenteFuture() throws UserNotFoundException {
        LocalDate localDate = LocalDate.now().minusDays(1);//mostro tutti i prestiti compresi quelli della giornata odierna
        Date data = Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
        return getPrestitiUtenteDopoData(data);
    }

    private boolean risorsaDisponibile(Risorsa risorsa) throws RisorsaNotFoundException {
        return risorsa.getCopieDisponibili() > 0 && risorsa.getStato() == Risorsa.StatoRisorsa.DISPONIBILE;
    }
}
