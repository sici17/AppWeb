package controller;


import support.auth.Utils;
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
    public List<Utente> getAllUsers() {
        return userService.cercaTutti();
    }

    @GetMapping
    public ResponseEntity<?> getUser() throws UserNotFoundException {
        return new ResponseEntity<>(userService.cercaUtente(Utils.getId()), HttpStatus.OK);
    }

    @GetMapping("/crediti")
    public ResponseEntity<?> getUserCreditiRimanenti() throws UserNotFoundException {
        return new ResponseEntity<>(userService.creditiUtente(), HttpStatus.OK);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleUserNotFoundException(UserNotFoundException e) {
        return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
    }

    @PostMapping
    public ResponseEntity<?> addUser(@RequestBody @Valid Utente utente) {
        try{
            return new ResponseEntity<>(userService.creaUtente(utente), HttpStatus.CREATED);
        } catch (UserAlreadyExistsException e) {
            return new ResponseEntity<>("Utente già esistente", HttpStatus.CONFLICT);
        }
    }

    @PreAuthorize("hasRole('admin')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable int id) throws UserNotFoundException {
        userService.eliminaUtente();
        return new ResponseEntity<>("Utente eliminato con successo", HttpStatus.OK);
    }
}
