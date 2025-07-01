package services;

import entities.*;
import repositories.*;
import support.auth.Utils;
import support.exceptions.UserAlreadyExistsException;
import support.exceptions.UserNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UtenteService {
    
    @Autowired private UtenteRepository userRepository;
    @Autowired private TesseraLibreriaRepository tesseraLibreriaRepository;

    @Transactional(readOnly = true)
    public List<Utente> cercaTutti() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Utente cercaUtente(int id) throws UserNotFoundException {
        return userRepository.findById(id).orElseThrow(UserNotFoundException::new);
    }

    @Transactional(readOnly = true)
    public Utente cercaUtentePerEmail(String email) throws UserNotFoundException {
        return userRepository.findByEmail(email).orElseThrow(UserNotFoundException::new);
    }

    @Transactional(readOnly = true)
    public Utente getUtenteCorrente() throws UserNotFoundException {
        return cercaUtentePerEmail(Utils.getEmail());
    }

    @Transactional(readOnly = true)
    public boolean esisteUtentePerEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    public Utente creaUtente(Utente utente) throws UserAlreadyExistsException {
        if (userRepository.existsById(utente.getId())) {
            throw new UserAlreadyExistsException();
        }
        return userRepository.save(utente);
    }

    @Transactional
    public Utente creaUtenteConEmail(Utente utente) throws UserAlreadyExistsException {
        if (userRepository.existsByEmail(utente.getEmail())) {
            throw new UserAlreadyExistsException();
        }
        return userRepository.save(utente);
    }

    @Transactional
    public void eliminaUtente() throws UserNotFoundException {
        Utente utente = getUtenteCorrente();
        userRepository.delete(utente);
    }

    @Transactional(readOnly = true)
    public int creditiUtente() throws UserNotFoundException {
        return tesseraLibreriaRepository.contaCreditiRimanentiUtente(getUtenteCorrente());
    }

    @Transactional(readOnly = true)
    public boolean isUtenteCorrenteAdmin() {
        try {
            Utils.getEmail();
            return true; // Implementare logica specifica per verificare ruoli admin
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> debugUtenteCorrente() {
        Map<String, Object> debug = new HashMap<>();
        try {
            String email = Utils.getEmail();
            Utente utente = getUtenteCorrente();
            int crediti = creditiUtente();
            List<TesseraLibreria> tessere = tesseraLibreriaRepository.findByUtente(utente);
            
            debug.put("jwtEmail", email);
            debug.put("dbId", utente.getId());
            debug.put("dbEmail", utente.getEmail());
            debug.put("dbNome", utente.getNome() + " " + utente.getCognome());
            debug.put("dbTipo", utente.getTipoUtente());
            debug.put("crediti", crediti);
            debug.put("numeroTessere", tessere.size());
            debug.put("status", "SUCCESS");
        } catch (Exception e) {
            debug.put("status", "ERROR");
            debug.put("error", e.getMessage());
        }
        return debug;
    }
}