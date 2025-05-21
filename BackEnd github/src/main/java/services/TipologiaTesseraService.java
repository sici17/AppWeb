package services;

import repositories.*;
import support.exceptions.TipologiaAlreadyExistException;
import support.exceptions.TipologiaNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import entities.*;

import java.util.ArrayList;
import java.util.List;

@Service
public class TipologiaTesseraService {
    private final TipologiaTesseraRepository tipologiaTesseraRepository;

    public TipologiaTesseraService(TipologiaTesseraRepository tipologiaTesseraRepository) {
        this.tipologiaTesseraRepository = tipologiaTesseraRepository;
    }

    @Transactional(readOnly = true)
    public List<TipologiaTessera> getAllTipologie(){
        return tipologiaTesseraRepository.findAll();
    }

    @Transactional(readOnly = true)
    public TipologiaTessera getTipologiaByCreditiMensili(int creditiMensili) throws TipologiaNotFoundException {
        return tipologiaTesseraRepository.findByCreditiMensili(creditiMensili).orElseThrow(TipologiaNotFoundException::new);
    }

    @Transactional(readOnly = true)
    public List<TipologiaTessera> getTipologieByPriceRange(double min, double max){
        return tipologiaTesseraRepository.findByPrezzoBetween(min,max).orElse(new ArrayList<>());
    }

    @Transactional
    public TipologiaTessera createTipologia(TipologiaTessera t) throws TipologiaAlreadyExistException {
        if(tipologiaTesseraRepository.existsById(t.getId()))
            throw new TipologiaAlreadyExistException();
        return tipologiaTesseraRepository.save(t);
    }

    @Transactional
    public void deleteTipologia(int id) throws TipologiaNotFoundException {
        TipologiaTessera t = getTipologiaByCreditiMensili(id);
        tipologiaTesseraRepository.delete(t);
    }

    @Transactional
    public void updateTipologia(int id, TipologiaTessera dettagli) throws TipologiaNotFoundException {
        TipologiaTessera tipologia = tipologiaTesseraRepository.findById(id).orElseThrow(TipologiaNotFoundException::new);
        tipologia.setNome(dettagli.getNome());
        tipologia.setCreditiMensili(dettagli.getCreditiMensili());
        tipologia.setDurataPrestitoGiorni(dettagli.getDurataPrestitoGiorni());
        tipologia.setCostoAnnuale(dettagli.getCostoAnnuale());
        tipologiaTesseraRepository.save(tipologia);
    }
    
    @Transactional(readOnly = true)
    public TipologiaTessera getTipologiaById(int id) throws TipologiaNotFoundException {
        return tipologiaTesseraRepository.findById(id)
                .orElseThrow(TipologiaNotFoundException::new);
    }
}
