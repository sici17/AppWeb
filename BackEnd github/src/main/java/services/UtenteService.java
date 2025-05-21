package services;



import entities.*;
import repositories.*;
import support.auth.Utils;
import support.exceptions.UserAlreadyExistsException;
import support.exceptions.UserNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public List<Utente> cercaTutti(){
        return userRepository.findAll();
    }

    public Utente cercaUtente(int id) throws UserNotFoundException {
        return userRepository.findById(id).orElseThrow(UserNotFoundException::new);
    }

    public Utente creaUtente(Utente utente) throws UserAlreadyExistsException{
        if(userRepository.existsById(utente.getId()))
            throw new UserAlreadyExistsException();
        return userRepository.save(utente);
    }

    public void eliminaUtente() throws UserNotFoundException {
        userRepository.delete(cercaUtente(Utils.getId()));
    }

    public int creditiUtente() throws UserNotFoundException {
        return tesseraLibreriaRepository.contaCreditiRimanentiUtente(cercaUtente(Utils.getId()));
    }
}
