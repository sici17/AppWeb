package services;


import entities.*;
import jakarta.transaction.Transactional;
import repositories.*;
import support.auth.Utils;
import support.exceptions.OrdineNotFoundException;
import support.exceptions.UserNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class OrdineService {

    private final OrdineRepository ordineRepository;
    private final UtenteRepository utenteRepository;

    @Autowired
    public OrdineService(OrdineRepository ordineRepository, UtenteRepository utenteRepository) {
        this.ordineRepository = ordineRepository;
        this.utenteRepository = utenteRepository;
    }

    @Transactional
    public Ordine salvaOrdine(Ordine ordine) {
        return ordineRepository.save(ordine);
    }

    @Transactional
    public List<Ordine> trovaTuttiGliOrdini() {
        return ordineRepository.findAll();
    }

    @Transactional
    public List<Ordine> filtraPerData(Date inizio, Date fine){
        return ordineRepository.findByDataCreazioneBetween(inizio,fine);
    }

    @Transactional
    public void eliminaOrdine(int id) throws OrdineNotFoundException {
        Ordine ordine = ordineRepository.findById(id)
                .orElseThrow(OrdineNotFoundException::new);
        ordineRepository.delete(ordine);
    }

    @Transactional
    public List<Ordine> trovaOrdinePerUtente() throws OrdineNotFoundException, UserNotFoundException {
        Utente u = utenteRepository.findById(Utils.getId()).orElseThrow(UserNotFoundException::new);
        return ordineRepository.findByUtente(u);
    }
}
