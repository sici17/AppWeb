
package controller;

import services.*;
import support.exceptions.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import entities.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("api/prestiti") 
public class PrestitoController {
    private final PrestitoService prestitoService;

    @Autowired
    public PrestitoController(PrestitoService prestitoService) {
        this.prestitoService = prestitoService;
    }

    @PreAuthorize("hasRole('utente')")
    @PostMapping
    public ResponseEntity<?> create(@RequestBody @Valid Prestito prestito) {
        try {
            
          
            Prestito prestitoCreato = prestitoService.create(prestito);
                        
            return new ResponseEntity<>(prestitoCreato, HttpStatus.CREATED);
            
        } catch (RisorsaFullException e) {
            return new ResponseEntity<>("risorsa non disponibile", HttpStatus.BAD_REQUEST);
        } catch (RisorsaNotFoundException e) {
            return new ResponseEntity<>("risorsa non trovata", HttpStatus.NOT_FOUND);
        } catch (PrestitoAlreadyExistsException e) {
            return new ResponseEntity<>("hai già un prestito attivo per questa risorsa", HttpStatus.CONFLICT);
        } catch (UserNotFoundException e) {
            return new ResponseEntity<>("utente non trovato", HttpStatus.NOT_FOUND);
        } catch (InsufficientCreditsException e) {
            return new ResponseEntity<>("crediti insufficienti", HttpStatus.PRECONDITION_FAILED);
        } catch (PrestitoNotValidException e) {
            return new ResponseEntity<>("impossibile prenotare per una data passata", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("errore interno del server", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente/future")
    public ResponseEntity<?> getFutureUtente() {
        try {
            List<Prestito> prestiti = prestitoService.getPrestitiUtenteFuture();
            return new ResponseEntity<>(prestiti, HttpStatus.OK);
        } catch (UserNotFoundException e) {
            return new ResponseEntity<>("utente non trovato", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("errore interno", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente")
    public ResponseEntity<?> getAllUtente() {
        try {
            List<Prestito> prestiti = prestitoService.getPrestitiUtente();
            return new ResponseEntity<>(prestiti, HttpStatus.OK);
        } catch (UserNotFoundException e) {
            return new ResponseEntity<>("utente non trovato", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("errore interno", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping
    public ResponseEntity<List<Prestito>> getAll() {
        try {
            List<Prestito> prestiti = prestitoService.findAll();
            return new ResponseEntity<>(prestiti, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(List.of(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
 
}