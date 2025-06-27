package services;

import jakarta.persistence.OptimisticLockException;
import repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import support.auth.Utils;
import support.exceptions.*;
import entities.*;
import java.util.*;

@Service
public class TesseraLibreriaService {

    @Autowired private TesseraLibreriaRepository tesseraLibreriaRepository;
    @Autowired private UtenteRepository utenteRepository;
    @Autowired private TipologiaTesseraRepository tipologiaTesseraRepository;

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
        Utente utente = utenteRepository.findByEmail(Utils.getEmail()).orElseThrow(UserNotFoundException::new);
        
        if (tessera.getTipologia() == null || tessera.getTipologia().getId() == 0) {
            throw new TipologiaNotFoundException();
        }
        
        TipologiaTessera tipologia = tipologiaTesseraRepository.findById(tessera.getTipologia().getId())
            .orElseThrow(TipologiaNotFoundException::new);
        
        if (!tipologia.isAccessibileA(utente.getTipoUtente())) {
            throw new TipologiaAlreadyExistException("Non autorizzato per questa tipologia");
        }
        
        boolean haGiaTipologia = tesseraLibreriaRepository.findByUtente(utente).stream()
            .anyMatch(t -> t.getTipologia().getId() == tipologia.getId() && t.getStato() == TesseraLibreria.StatoTessera.ATTIVA);
        
        if (haGiaTipologia) {
            throw new TipologiaAlreadyExistException("Hai già una tessera attiva di questo tipo");
        }
        
        TesseraLibreria nuovaTessera = new TesseraLibreria();
        nuovaTessera.setUtente(utente);
        nuovaTessera.setTipologia(tipologia);
        nuovaTessera.setCreditiRimanenti(tipologia.getCreditiMensili());
        nuovaTessera.setDataEmissione(new Date());
        nuovaTessera.setStato(TesseraLibreria.StatoTessera.ATTIVA);
        nuovaTessera.setRinnovoAutomatico(tipologia.isRinnovoAutomatico());
        
        return tesseraLibreriaRepository.save(nuovaTessera);
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
        return tesseraLibreriaRepository.save(tessera);
    }

    @Transactional(readOnly = true)
    public List<TesseraLibreria> getTessereUtenteConCrediti(Utente utente) {
        return tesseraLibreriaRepository.findByUtenteAndCrediti(utente);
    }

    @Transactional(rollbackFor = OptimisticLockException.class)
    public void scalaCredito(int id) throws UserNotFoundException, InsufficientCreditsException {
        Utente utente = utenteRepository.findById(id).orElseThrow(UserNotFoundException::new);
        List<TesseraLibreria> tessereAttive = tesseraLibreriaRepository.findByUtenteAndCrediti(utente);
        if (tessereAttive.isEmpty()) throw new InsufficientCreditsException();

        TesseraLibreria tessera = tessereAttive.get(0);
        tessera.setCreditiRimanenti(tessera.getCreditiRimanenti() - 1);
        tesseraLibreriaRepository.save(tessera);
    }

    @Transactional
    public TesseraLibreria richiedeTessera(TipologiaTessera tipologia, String noteRichiesta) 
            throws UserNotFoundException, TipologiaNotFoundException, TipologiaAlreadyExistException {
        
        Utente utente = utenteRepository.findByEmail(Utils.getEmail()).orElseThrow(UserNotFoundException::new);
        
        if (!tipologia.isAccessibileA(utente.getTipoUtente())) {
            throw new TipologiaAlreadyExistException("Non autorizzato per questa tipologia");
        }
        
        boolean haGiaRichiesta = tesseraLibreriaRepository.findByUtente(utente).stream()
            .anyMatch(t -> t.getTipologia().getId() == tipologia.getId() && 
                     (t.getStato() == TesseraLibreria.StatoTessera.RICHIESTA_PENDING ||
                      t.getStato() == TesseraLibreria.StatoTessera.ATTIVA));
        
        if (haGiaRichiesta) {
            throw new TipologiaAlreadyExistException("Hai già una richiesta/tessera per questa tipologia");
        }
        
        TesseraLibreria richiesta = new TesseraLibreria();
        richiesta.setUtente(utente);
        richiesta.setTipologia(tipologia);
        richiesta.setStato(TesseraLibreria.StatoTessera.RICHIESTA_PENDING);
        richiesta.setDataRichiesta(new Date());
        richiesta.setNoteRichiesta(noteRichiesta);
        richiesta.setCreditiRimanenti(0);
        
        return tesseraLibreriaRepository.save(richiesta);
    }

    @Transactional
    public TesseraLibreria approvaTessera(int richiestaId, String noteAdmin, Utente adminCorrente) 
            throws TesseraNotFoundException {
        
        TesseraLibreria richiesta = tesseraLibreriaRepository.findById(richiestaId)
            .orElseThrow(TesseraNotFoundException::new);
        
        if (richiesta.getStato() != TesseraLibreria.StatoTessera.RICHIESTA_PENDING) {
            throw new IllegalStateException("La richiesta deve essere in stato PENDING");
        }
        
        richiesta.setStato(TesseraLibreria.StatoTessera.ATTIVA);
        richiesta.setDataApprovazione(new Date());
        richiesta.setAdminApprovatoreId(adminCorrente.getId());
        richiesta.setNoteAdmin(noteAdmin);
        richiesta.setCreditiRimanenti(richiesta.getTipologia().getCreditiMensili());
        
        if (richiesta.getDataEmissione() == null) {
            richiesta.setDataEmissione(new Date());
        }
        
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.YEAR, 1);
        richiesta.setDataScadenza(cal.getTime());
        
        if (richiesta.getNumeroTessera() == null || richiesta.getNumeroTessera().isEmpty()) {
            richiesta.setNumeroTessera(generaNumeroTessera());
        }
        
        return tesseraLibreriaRepository.save(richiesta);
    }

    @Transactional
    public TesseraLibreria rifiutaTessera(int richiestaId, String motivoRifiuto, Utente adminCorrente) 
            throws TesseraNotFoundException {
        
        TesseraLibreria richiesta = tesseraLibreriaRepository.findById(richiestaId)
            .orElseThrow(TesseraNotFoundException::new);
        
        if (richiesta.getStato() != TesseraLibreria.StatoTessera.RICHIESTA_PENDING) {
            throw new IllegalStateException("la richiesta deve essere in stato pending");
        }
        
        richiesta.setStato(TesseraLibreria.StatoTessera.RICHIESTA_RIFIUTATA);
        richiesta.setDataApprovazione(new Date());
        richiesta.setAdminApprovatoreId(adminCorrente.getId());
        richiesta.setNoteAdmin(motivoRifiuto);
        
        return tesseraLibreriaRepository.save(richiesta);
    }

    @Transactional(readOnly = true)
    public List<TesseraLibreria> getRichiesteInAttesa() {
        List<TesseraLibreria> richieste = tesseraLibreriaRepository.findRichiesteInAttesa();
        // Force lazy loading
        richieste.forEach(r -> {
            r.getUtente().getNome();
            r.getTipologia().getNome();
        });
        return richieste;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatisticheAdmin() {
        Map<String, Object> stats = new HashMap<>();
        long tessereAttive = tesseraLibreriaRepository.countTessereAttive();
        long tessereSospese = tesseraLibreriaRepository.countTessereSospese();
        long tessereRevocate = tesseraLibreriaRepository.countTessereRevocate();
        long richiesteInAttesa = tesseraLibreriaRepository.countRichiesteInAttesa();
        
        stats.put("tessereAttive", tessereAttive);
        stats.put("tessereSospese", tessereSospese);
        stats.put("tessereRevocate", tessereRevocate);
        stats.put("richiesteInAttesa", richiesteInAttesa);
        stats.put("totale", tessereAttive + tessereSospese + tessereRevocate);
        
        return stats;
    }

    @Transactional(readOnly = true)
    public List<TesseraLibreria> getTessereInScadenza(int giorni) {
        Date dataLimite = new Date(System.currentTimeMillis() + (giorni * 86400000L));
        return tesseraLibreriaRepository.findTessereAttive().stream()
            .filter(t -> t.getDataScadenza() != null && t.getDataScadenza().before(dataLimite))
            .sorted(Comparator.comparing(TesseraLibreria::getDataScadenza))
            .toList();
    }

    private String generaNumeroTessera() {
        int anno = Calendar.getInstance().get(Calendar.YEAR);
        int random = (int) (Math.random() * 9999);
        return String.format("LIB%d%04d", anno, random);
    }
}