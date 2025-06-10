// backend/src/main/java/services/UtenteService.java - VERSIONE AGGIORNATA
package services;

import entities.*;
import repositories.*;
import support.auth.Utils;
import support.exceptions.UserAlreadyExistsException;
import support.exceptions.UserNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UtenteService {
    private final UtenteRepository userRepository;
    private final TesseraLibreriaRepository tesseraLibreriaRepository;

    @Autowired
    public UtenteService(UtenteRepository userRepository, TesseraLibreriaRepository tesseraLibreriaRepository) {
        this.userRepository = userRepository;
        this.tesseraLibreriaRepository = tesseraLibreriaRepository;
    }

    @Transactional(readOnly = true)
    public List<Utente> cercaTutti(){
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Utente cercaUtente(int id) throws UserNotFoundException {
        return userRepository.findById(id).orElseThrow(UserNotFoundException::new);
    }

  
    @Transactional(readOnly = true)
    public Utente cercaUtentePerEmail(String email) throws UserNotFoundException {
        return userRepository.findByEmail(email).orElseThrow(() -> {
            System.err.println("❌ Utente non trovato con email: " + email);
            return new UserNotFoundException();
        });
    }

    /**
     * 🆕 NUOVO: Ottieni l'utente attualmente autenticato
     */
    @Transactional(readOnly = true)
    public Utente getUtenteCorrente() throws UserNotFoundException {
        try {
            // Prova prima con l'email dal JWT
            String email = Utils.getEmail();
            System.out.println("🔍 Ricerca utente per email: " + email);
            
            return cercaUtentePerEmail(email);
            
        } catch (Exception e) {
            System.err.println("❌ Errore ricerca utente corrente per email: " + e.getMessage());
            
            // Fallback: usa il vecchio metodo con ID
            try {
                @SuppressWarnings("deprecation")
                int id = Utils.getId();
                System.out.println("🔍 Fallback: ricerca utente per ID: " + id);
                return cercaUtente(id);
            } catch (Exception ex) {
                System.err.println("❌ Errore anche con fallback ID: " + ex.getMessage());
                throw new UserNotFoundException();
            }
        }
    }

    @Transactional
    public Utente creaUtente(Utente utente) throws UserAlreadyExistsException{
        if(userRepository.existsById(utente.getId()))
            throw new UserAlreadyExistsException();
        return userRepository.save(utente);
    }

    /**
     * 🆕 NUOVO: Crea utente verificando anche l'email
     */
    @Transactional
    public Utente creaUtenteConEmail(Utente utente) throws UserAlreadyExistsException{
        if(userRepository.existsByEmail(utente.getEmail())) {
            System.err.println("❌ Utente già esistente con email: " + utente.getEmail());
            throw new UserAlreadyExistsException();
        }
        
        System.out.println("✅ Creazione nuovo utente con email: " + utente.getEmail());
        return userRepository.save(utente);
    }

    @Transactional
    public void eliminaUtente() throws UserNotFoundException {
        // Usa il nuovo metodo per ottenere l'utente corrente
        Utente utente = getUtenteCorrente();
        userRepository.delete(utente);
    }

    @Transactional(readOnly = true)
    public int creditiUtente() throws UserNotFoundException {
        // Usa il nuovo metodo per ottenere l'utente corrente
        Utente utente = getUtenteCorrente();
        return tesseraLibreriaRepository.contaCreditiRimanentiUtente(utente);
    }
}