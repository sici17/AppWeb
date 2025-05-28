package services;

import repositories.*;
import support.exceptions.TipologiaAlreadyExistException;
import support.exceptions.TipologiaNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import entities.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TipologiaTesseraService {
    private final TipologiaTesseraRepository tipologiaTesseraRepository;

    public TipologiaTesseraService(TipologiaTesseraRepository tipologiaTesseraRepository) {
        this.tipologiaTesseraRepository = tipologiaTesseraRepository;
    }

    @Transactional(readOnly = true)
    public List<TipologiaTessera> getAllTipologie(){
        List<TipologiaTessera> tipologie = tipologiaTesseraRepository.findAll();
        
        // 🔥 FORCE INIT per evitare LazyInitializationException
        for (TipologiaTessera tipologia : tipologie) {
            if (tipologia.getTipiUtentiAmmessi() != null) {
                tipologia.getTipiUtentiAmmessi().size(); // Trigger lazy loading
            }
        }
        
        return tipologie;
    }

    // 🆕 NUOVO METODO: Ottieni solo le tipologie accessibili per un tipo di utente
    @Transactional(readOnly = true)
    public List<TipologiaTessera> getTipologiePerTipoUtente(Utente.TipoUtente tipoUtente) {
        System.out.println("=== FILTRO TIPOLOGIE PER TIPO UTENTE ===");
        System.out.println("Tipo utente: " + tipoUtente);
        
        List<TipologiaTessera> tutteLeTipologie = tipologiaTesseraRepository.findAll();
        System.out.println("Tipologie totali nel DB: " + tutteLeTipologie.size());
        
        // 🔥 FORCE INIT per evitare LazyInitializationException
        for (TipologiaTessera tipologia : tutteLeTipologie) {
            if (tipologia.getTipiUtentiAmmessi() != null) {
                tipologia.getTipiUtentiAmmessi().size(); // Trigger lazy loading
            }
        }
        
        List<TipologiaTessera> tipologieAccessibili = tutteLeTipologie.stream()
            .filter(TipologiaTessera::isAttiva) // Solo quelle attive
            .filter(tipologia -> tipologia.isAccessibileA(tipoUtente)) // Solo quelle accessibili
            .collect(Collectors.toList());
        
        System.out.println("Tipologie accessibili per " + tipoUtente + ": " + tipologieAccessibili.size());
        
        // Debug: mostra dettagli di ogni tipologia
        for (TipologiaTessera tip : tipologieAccessibili) {
            System.out.println("- " + tip.getNome() + " (ID: " + tip.getId() + ") - " + 
                             tip.getDescrizioneTipiAmmessi());
        }
        
        return tipologieAccessibili;
    }

    // 🆕 NUOVO METODO: Verifica se un utente può accedere a una tipologia specifica
    @Transactional(readOnly = true)
    public boolean canUserAccessTipologia(Utente.TipoUtente tipoUtente, int tipologiaId) 
            throws TipologiaNotFoundException {
        
        TipologiaTessera tipologia = tipologiaTesseraRepository.findById(tipologiaId)
            .orElseThrow(TipologiaNotFoundException::new);
        
        boolean canAccess = tipologia.isAttiva() && tipologia.isAccessibileA(tipoUtente);
        
        System.out.println("=== VERIFICA ACCESSO TIPOLOGIA ===");
        System.out.println("Utente: " + tipoUtente);
        System.out.println("Tipologia: " + tipologia.getNome() + " (ID: " + tipologiaId + ")");
        System.out.println("Attiva: " + tipologia.isAttiva());
        System.out.println("Accessibile: " + tipologia.isAccessibileA(tipoUtente));
        System.out.println("Può accedere: " + canAccess);
        
        return canAccess;
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
        
        // 🆕 Aggiorna anche i tipi utenti ammessi se specificati
        if (dettagli.getTipiUtentiAmmessi() != null) {
            tipologia.setTipiUtentiAmmessi(dettagli.getTipiUtentiAmmessi());
        }
        
        tipologiaTesseraRepository.save(tipologia);
    }
    
    @Transactional(readOnly = true)
    public TipologiaTessera getTipologiaById(int id) throws TipologiaNotFoundException {
        TipologiaTessera tipologia = tipologiaTesseraRepository.findById(id)
                .orElseThrow(TipologiaNotFoundException::new);
        
        // 🔥 FORCE INIT per evitare LazyInitializationException
        if (tipologia.getTipiUtentiAmmessi() != null) {
            tipologia.getTipiUtentiAmmessi().size();
        }
        
        return tipologia;
    }
}