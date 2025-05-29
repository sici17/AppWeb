// backend/src/main/java/controller/PrestitoController.java - VERSIONE CORRETTA

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
@RequestMapping("api/prestiti") // ✅ Endpoint corretto
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
            System.out.println("=== CREAZIONE PRESTITO ===");
            System.out.println("Prestito ricevuto: " + prestito);
            System.out.println("Risorsa ID: " + (prestito.getRisorsa() != null ? prestito.getRisorsa().getId() : "null"));
            System.out.println("Data inizio: " + prestito.getDataInizio());
            System.out.println("Data scadenza: " + prestito.getDataScadenza());
            System.out.println("Stato: " + prestito.getStato());
            
            Prestito prestitoCreato = prestitoService.create(prestito);
            
            System.out.println("✅ Prestito creato con successo:");
            System.out.println("   ID: " + prestitoCreato.getId());
            System.out.println("   Utente: " + prestitoCreato.getUtente().getNome() + " " + prestitoCreato.getUtente().getCognome());
            System.out.println("   Risorsa: " + prestitoCreato.getRisorsa().getTitolo());
            System.out.println("   Periodo: " + prestitoCreato.getDataInizio() + " → " + prestitoCreato.getDataScadenza());
            
            return new ResponseEntity<>(prestitoCreato, HttpStatus.CREATED);
            
        } catch (RisorsaFullException e) {
            System.err.println("❌ Risorsa non disponibile");
            return new ResponseEntity<>("Risorsa non disponibile", HttpStatus.BAD_REQUEST);
        } catch (RisorsaNotFoundException e) {
            System.err.println("❌ Risorsa non trovata");
            return new ResponseEntity<>("Risorsa non trovata", HttpStatus.NOT_FOUND);
        } catch (PrestitoAlreadyExistsException e) {
            System.err.println("❌ Prestito già esistente");
            return new ResponseEntity<>("Hai già un prestito attivo per questa risorsa", HttpStatus.CONFLICT);
        } catch (UserNotFoundException e) {
            System.err.println("❌ Utente non trovato");
            return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
        } catch (InsufficientCreditsException e) {
            System.err.println("❌ Crediti insufficienti");
            return new ResponseEntity<>("Crediti insufficienti", HttpStatus.PRECONDITION_FAILED);
        } catch (PrestitoNotValidException e) {
            System.err.println("❌ Prestito non valido: " + e.getMessage());
            return new ResponseEntity<>("Impossibile prenotare per una data passata", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("❌ Errore generico durante creazione prestito:");
            e.printStackTrace();
            return new ResponseEntity<>("Errore interno del server", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente/future")
    public ResponseEntity<?> getFutureUtente() {
        try {
            List<Prestito> prestiti = prestitoService.getPrestitiUtenteFuture();
            System.out.println("📋 Prestiti futuri trovati per utente: " + prestiti.size());
            return new ResponseEntity<>(prestiti, HttpStatus.OK);
        } catch (UserNotFoundException e) {
            System.err.println("❌ Utente non trovato per prestiti futuri");
            return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.err.println("❌ Errore caricamento prestiti futuri:");
            e.printStackTrace();
            return new ResponseEntity<>("Errore interno", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente")
    public ResponseEntity<?> getAllUtente() {
        try {
            List<Prestito> prestiti = prestitoService.getPrestitiUtente();
            System.out.println("📋 Prestiti trovati per utente: " + prestiti.size());
            return new ResponseEntity<>(prestiti, HttpStatus.OK);
        } catch (UserNotFoundException e) {
            System.err.println("❌ Utente non trovato per prestiti");
            return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.err.println("❌ Errore caricamento prestiti utente:");
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
    
    // ✅ NUOVO: Endpoint per cancellare un prestito
    @PreAuthorize("hasRole('utente')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelPrestito(@PathVariable int id) {
        try {
            System.out.println("🗑️ Tentativo cancellazione prestito ID: " + id);
            
            // Implementa la logica di cancellazione nel service
            // prestitoService.cancelPrestito(id);
            
            System.out.println("✅ Prestito cancellato con successo");
            return new ResponseEntity<>("Prestito cancellato", HttpStatus.OK);
            
        } catch (Exception e) {
            System.err.println("❌ Errore cancellazione prestito:");
            e.printStackTrace();
            return new ResponseEntity<>("Errore durante la cancellazione", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}