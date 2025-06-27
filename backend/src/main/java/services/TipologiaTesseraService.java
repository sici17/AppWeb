package services;

import repositories.*;
import support.exceptions.TipologiaAlreadyExistException;
import support.exceptions.TipologiaNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import entities.*;
import java.util.ArrayList;
import java.util.List;

@Service
public class TipologiaTesseraService {
    
    @Autowired
    private TipologiaTesseraRepository tipologiaTesseraRepository;

    @Transactional(readOnly = true)
    public List<TipologiaTessera> getAllTipologie() {
        List<TipologiaTessera> tipologie = tipologiaTesseraRepository.findAll();
        tipologie.forEach(t -> {
            if (t.getTipiUtentiAmmessi() != null) t.getTipiUtentiAmmessi().size();
        });
        return tipologie;
    }

    @Transactional(readOnly = true)
    public List<TipologiaTessera> getTipologiePerTipoUtente(Utente.TipoUtente tipoUtente) {
        return tipologiaTesseraRepository.findAll().stream()
            .peek(t -> { if (t.getTipiUtentiAmmessi() != null) t.getTipiUtentiAmmessi().size(); })
            .filter(TipologiaTessera::isAttiva)
            .filter(t -> t.isAccessibileA(tipoUtente))
            .toList();
    }

    @Transactional(readOnly = true)
    public boolean canUserAccessTipologia(Utente.TipoUtente tipoUtente, int tipologiaId) 
            throws TipologiaNotFoundException {
        TipologiaTessera tipologia = tipologiaTesseraRepository.findById(tipologiaId)
            .orElseThrow(TipologiaNotFoundException::new);
        return tipologia.isAttiva() && tipologia.isAccessibileA(tipoUtente);
    }

    @Transactional(readOnly = true)
    public TipologiaTessera getTipologiaByCreditiMensili(int creditiMensili) throws TipologiaNotFoundException {
        return tipologiaTesseraRepository.findByCreditiMensili(creditiMensili)
            .orElseThrow(TipologiaNotFoundException::new);
    }

    @Transactional(readOnly = true)
    public List<TipologiaTessera> getTipologieByPriceRange(double min, double max) {
        return tipologiaTesseraRepository.findByPrezzoBetween(min, max).orElse(new ArrayList<>());
    }

    @Transactional
    public TipologiaTessera createTipologia(TipologiaTessera t) throws TipologiaAlreadyExistException {
        if (tipologiaTesseraRepository.existsById(t.getId())) {
            throw new TipologiaAlreadyExistException();
        }
        return tipologiaTesseraRepository.save(t);
    }

    @Transactional
    public void deleteTipologia(int id) throws TipologiaNotFoundException {
        TipologiaTessera t = getTipologiaByCreditiMensili(id);
        tipologiaTesseraRepository.delete(t);
    }

    @Transactional
    public void updateTipologia(int id, TipologiaTessera dettagli) throws TipologiaNotFoundException {
        TipologiaTessera tipologia = tipologiaTesseraRepository.findById(id)
            .orElseThrow(TipologiaNotFoundException::new);
        
        tipologia.setNome(dettagli.getNome());
        tipologia.setCreditiMensili(dettagli.getCreditiMensili());
        tipologia.setDurataPrestitoGiorni(dettagli.getDurataPrestitoGiorni());
        tipologia.setCostoAnnuale(dettagli.getCostoAnnuale());
        
        if (dettagli.getTipiUtentiAmmessi() != null) {
            tipologia.setTipiUtentiAmmessi(dettagli.getTipiUtentiAmmessi());
        }
        
        tipologiaTesseraRepository.save(tipologia);
    }
    
    @Transactional(readOnly = true)
    public TipologiaTessera getTipologiaById(int id) throws TipologiaNotFoundException {
        TipologiaTessera tipologia = tipologiaTesseraRepository.findById(id)
            .orElseThrow(TipologiaNotFoundException::new);
        
        if (tipologia.getTipiUtentiAmmessi() != null) {
            tipologia.getTipiUtentiAmmessi().size();
        }
        
        return tipologia;
    }
}