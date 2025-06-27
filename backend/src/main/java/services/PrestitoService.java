package services;

import entities.*;
import repositories.*;
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
    
    @Autowired private PrestitoRepository prestitoRepository;
    @Autowired private RisorsaRepository risorsaRepository;
    @Autowired private UtenteService utenteService;
    @Autowired private TesseraLibreriaService tesseraLibreriaService;

    @Transactional
    public Prestito create(Prestito prestito) throws RisorsaFullException, RisorsaNotFoundException, 
            PrestitoAlreadyExistsException, UserNotFoundException, InsufficientCreditsException, 
            PrestitoNotValidException {
     
        Utente utente = utenteService.getUtenteCorrente();
        Risorsa risorsa = validaRisorsa(prestito);
        
        prestito.setUtente(utente);
        prestito.setRisorsa(risorsa);
        if (prestito.getDataInizio() == null) prestito.setDataInizio(new Date());
        if (prestito.getStato() == null) prestito.setStato(Prestito.StatoPrestito.ATTIVO);

        validaDate(prestito);
        
        if (prestitoRepository.existsPrestitoByUtenteAndRisorsaAndStato(utente, risorsa, Prestito.StatoPrestito.ATTIVO)) {
            throw new PrestitoAlreadyExistsException();
        }
        if (!isRisorsaDisponibile(risorsa)) throw new RisorsaFullException();
        if (utenteService.creditiUtente() <= 0) throw new InsufficientCreditsException();
        if (tesseraLibreriaService.getTessereUtenteConCrediti(utente).isEmpty()) {
            throw new InsufficientCreditsException();
        }

        tesseraLibreriaService.scalaCredito(utente.getId());
        risorsa.setCopieDisponibili(risorsa.getCopieDisponibili() - 1);
        risorsaRepository.save(risorsa);

        return prestitoRepository.save(prestito);
    }

    @Transactional(readOnly = true)
    public List<Prestito> findAll() {
        return prestitoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Prestito> getPrestitiUtente() throws UserNotFoundException {
        return prestitoRepository.findByUtente(utenteService.getUtenteCorrente());
    }

    @Transactional(readOnly = true)
    public List<Prestito> getPrestitiUtenteFuture() throws UserNotFoundException {
        Date ieri = Date.from(LocalDate.now().minusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
        return prestitoRepository.findByUtenteAndDataInizioAfter(utenteService.getUtenteCorrente(), ieri);
    }

    @Transactional
    public void cancelPrestito(int prestitoId) throws PrestitoNotFoundException, UserNotFoundException {
        Prestito prestito = prestitoRepository.findById(prestitoId).orElseThrow(PrestitoNotFoundException::new);
        Utente utente = utenteService.getUtenteCorrente();
        
        if (prestito.getUtente().getId() != utente.getId()) {
            throw new IllegalStateException("Non autorizzato");
        }
        if (prestito.getStato() != Prestito.StatoPrestito.ATTIVO) {
            throw new IllegalStateException("Prestito non cancellabile");
        }
        
        Risorsa risorsa = prestito.getRisorsa();
        risorsa.setCopieDisponibili(risorsa.getCopieDisponibili() + 1);
        risorsaRepository.save(risorsa);
        prestitoRepository.delete(prestito);
    }

    private Risorsa validaRisorsa(Prestito prestito) throws RisorsaNotFoundException {
        if (prestito.getRisorsa() == null || prestito.getRisorsa().getId() == 0) {
            throw new RisorsaNotFoundException();
        }
        return risorsaRepository.findById(prestito.getRisorsa().getId()).orElseThrow(RisorsaNotFoundException::new);
    }
    
    private void validaDate(Prestito prestito) throws PrestitoNotValidException {
        Date ieri = new Date(System.currentTimeMillis() - 86400000L); // 24h in ms
        if (prestito.getDataInizio().before(ieri)) {
            throw new PrestitoNotValidException("Data passata non valida");
        }
    }

    private boolean isRisorsaDisponibile(Risorsa risorsa) {
        return risorsa.getCopieDisponibili() > 0 && risorsa.getStato() == Risorsa.StatoRisorsa.DISPONIBILE;
    }
}