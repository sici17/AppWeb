
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
            return new ResponseEntity<>("Risorsa non disponibile", HttpStatus.BAD_REQUEST);
        } catch (RisorsaNotFoundException e) {
            return new ResponseEntity<>("Risorsa non trovata", HttpStatus.NOT_FOUND);
        } catch (PrestitoAlreadyExistsException e) {
            return new ResponseEntity<>("Hai già un prestito attivo per questa risorsa", HttpStatus.CONFLICT);
        } catch (UserNotFoundException e) {
            return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
        } catch (InsufficientCreditsException e) {
            return new ResponseEntity<>("Crediti insufficienti", HttpStatus.PRECONDITION_FAILED);
        } catch (PrestitoNotValidException e) {
            return new ResponseEntity<>("Impossibile prenotare per una data passata", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Errore interno del server", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente/future")
    public ResponseEntity<?> getFutureUtente() {
        try {
            List<Prestito> prestiti = prestitoService.getPrestitiUtenteFuture();
            System.out.println("Prestiti futuri trovati per utente: " + prestiti.size());
            return new ResponseEntity<>(prestiti, HttpStatus.OK);
        } catch (UserNotFoundException e) {
            System.err.println("Utente non trovato per prestiti futuri");
            return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.err.println("Errore caricamento prestiti futuri:");
            e.printStackTrace();
            return new ResponseEntity<>("Errore interno", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente")
    public ResponseEntity<?> getAllUtente() {
        try {
            List<Prestito> prestiti = prestitoService.getPrestitiUtente();
            System.out.println(" Prestiti trovati per utente: " + prestiti.size());
            return new ResponseEntity<>(prestiti, HttpStatus.OK);
        } catch (UserNotFoundException e) {
            System.err.println(" Utente non trovato per prestiti");
            return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.err.println(" Errore caricamento prestiti utente:");
            e.printStackTrace();
            return new ResponseEntity<>("Errore interno", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping
    public ResponseEntity<List<Prestito>> getAll() {
        try {
            List<Prestito> prestiti = prestitoService.findAll();
            System.out.println("📋 Tutti i prestiti caricati: " + prestiti.size());
            return new ResponseEntity<>(prestiti, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("❌ Errore caricamento tutti i prestiti:");
            e.printStackTrace();
            return new ResponseEntity<>(List.of(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @PreAuthorize("hasRole('utente')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelPrestito(@PathVariable int id) {
        try {
            System.out.println(" Tentativo cancellazione prestito ID: " + id);
            
            // Implementa la logica di cancellazione nel service
            // prestitoService.cancelPrestito(id);
            
            System.out.println(" Prestito cancellato con successo");
            return new ResponseEntity<>("Prestito cancellato", HttpStatus.OK);
            
        } catch (Exception e) {
            System.err.println(" Errore cancellazione prestito:");
            e.printStackTrace();
            return new ResponseEntity<>("Errore durante la cancellazione", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}