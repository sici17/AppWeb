package controller;

import support.exceptions.*;
import services.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import entities.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/utenti")
public class UtentiController {
    private final UtenteService userService;

    @Autowired
    public UtentiController(UtenteService userService) {
        this.userService = userService;
    }

    @GetMapping("/all")
    public ResponseEntity<List<Utente>> getAllUsers() {
        try {
            List<Utente> users = userService.cercaTutti();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            throw e;
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping
    public ResponseEntity<?> getUser() throws UserNotFoundException {
        try {
            Utente utente = userService.getUtenteCorrente();
            
            
            return new ResponseEntity<>(utente, HttpStatus.OK);
        } catch (UserNotFoundException e) {
            throw e;
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/crediti")
    public ResponseEntity<?> getUserCreditiRimanenti() throws UserNotFoundException {
        try {
            int crediti = userService.creditiUtente();
            return new ResponseEntity<>(crediti, HttpStatus.OK);
        } catch (UserNotFoundException e) {
            throw e;
        }
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleUserNotFoundException(UserNotFoundException e) {
        return new ResponseEntity<>("utente non trovato", HttpStatus.NOT_FOUND);
    }

    @PostMapping
    public ResponseEntity<?> addUser(@RequestBody @Valid Utente utente) {
        try{
            return new ResponseEntity<>(userService.creaUtenteConEmail(utente), HttpStatus.CREATED);
        } catch (UserAlreadyExistsException e) {
            return new ResponseEntity<>("utente già esistente", HttpStatus.CONFLICT);
        }
    }

    @PreAuthorize("hasRole('admin')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable int id) throws UserNotFoundException {
        userService.eliminaUtente();
        return new ResponseEntity<>("utente eliminato con successo", HttpStatus.OK);
    }
}