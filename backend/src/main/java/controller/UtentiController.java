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
        System.out.println("Controller getAllUsers chiamato!");
        try {
            List<Utente> users = userService.cercaTutti();
            System.out.println("Utenti trovati: " + users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.out.println("Errore nel controller: " + e.getMessage());
            throw e;
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping
    public ResponseEntity<?> getUser() throws UserNotFoundException {
        try {
            Utente utente = userService.getUtenteCorrente();
            System.out.println("✅ Utente corrente trovato:");
            System.out.println("   ID: " + utente.getId());
            System.out.println("   Nome: " + utente.getNome() + " " + utente.getCognome());
            System.out.println("   Email: " + utente.getEmail());
            
            return new ResponseEntity<>(utente, HttpStatus.OK);
        } catch (UserNotFoundException e) {
            System.err.println("❌ Utente corrente non trovato");
            throw e;
        }
    }

    // 🔧 CORRETTO: Usa il nuovo metodo per i crediti
    @PreAuthorize("hasRole('utente')")
    @GetMapping("/crediti")
    public ResponseEntity<?> getUserCreditiRimanenti() throws UserNotFoundException {
        try {
            int crediti = userService.creditiUtente();
            System.out.println("✅ Crediti utente corrente: " + crediti);
            return new ResponseEntity<>(crediti, HttpStatus.OK);
        } catch (UserNotFoundException e) {
            System.err.println("❌ Errore nel caricamento crediti utente");
            throw e;
        }
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleUserNotFoundException(UserNotFoundException e) {
        return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
    }

    @PostMapping
    public ResponseEntity<?> addUser(@RequestBody @Valid Utente utente) {
        try{
            // 🔧 Usa il nuovo metodo che controlla anche l'email
            return new ResponseEntity<>(userService.creaUtenteConEmail(utente), HttpStatus.CREATED);
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