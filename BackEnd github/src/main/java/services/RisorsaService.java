package services;

import repositories.*;
import support.exceptions.RisorsaAlreadyExistsException;
import support.exceptions.RisorsaNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import entities.*;

import java.util.List;

@Service
public class RisorsaService {
    private final RisorsaRepository risorsaRepository;

    public RisorsaService(RisorsaRepository risorsaRepository) {
        this.risorsaRepository = risorsaRepository;
    }

    @Transactional(readOnly = true)
    public List<Risorsa> getAllRisorse() {
        return risorsaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Risorsa getRisorsaById(int id) throws RisorsaNotFoundException{
        return risorsaRepository.findById(id).orElseThrow(RisorsaNotFoundException::new);
    }

    @Transactional(readOnly = true)
    public Risorsa getRisorsaByTitolo(String titolo) throws RisorsaNotFoundException{
        return risorsaRepository.findByTitolo(titolo).orElseThrow(RisorsaNotFoundException::new);
    }

    @Transactional(readOnly = true)
    public List<Risorsa> getRisorseContainingTitolo(String titolo){
        return risorsaRepository.findByTitoloContainingIgnoreCase(titolo);
    }

    @Transactional
    public Risorsa createRisorsa(Risorsa r) throws RisorsaAlreadyExistsException {
        if(risorsaRepository.existsById(r.getId()))
            throw new RisorsaAlreadyExistsException();
        return risorsaRepository.save(r);
    }

    @Transactional
    public void deleteRisorsa(int id) throws RisorsaNotFoundException{
        Risorsa r = getRisorsaById(id);
        risorsaRepository.delete(r);
    }

    @Transactional
    public void updateRisorsa(int id, Risorsa risorsa) throws RisorsaNotFoundException{
        Risorsa r = getRisorsaById(id);
        r.setTitolo(risorsa.getTitolo());
        r.setAutore(risorsa.getAutore());
        r.setIsbn(risorsa.getIsbn());
        r.setTipo(risorsa.getTipo());
        r.setEditore(risorsa.getEditore());
        r.setAnnoPubblicazione(risorsa.getAnnoPubblicazione());
        r.setCollocazione(risorsa.getCollocazione());
        r.setCopieDisponibili(risorsa.getCopieDisponibili());
        r.setCopieTotali(risorsa.getCopieTotali());
        r.setStato(risorsa.getStato());
        risorsaRepository.save(r);
    }
}
