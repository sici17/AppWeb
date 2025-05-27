package controller;

import support.auth.Utils;
import support.exceptions.*;
import entities.*;
import jakarta.validation.Valid;
import services.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tessere")
public class TesseraLibreriaController {

    private final TesseraLibreriaService tesseraLibreriaService;
    private final TipologiaTesseraService tipologiaTesseraService;
    private final UtenteService utenteService;

    public TesseraLibreriaController(TesseraLibreriaService tesseraLibreriaService, 
            TipologiaTesseraService tipologiaTesseraService,
            UtenteService utenteService) {
     this.tesseraLibreriaService = tesseraLibreriaService;
     this.tipologiaTesseraService = tipologiaTesseraService;
     this.utenteService = utenteService;
    }

    @ExceptionHandler(TesseraNotFoundException.class)
    public ResponseEntity<String> handleTesseraNotFoundException(TesseraNotFoundException e) {
        return new ResponseEntity<>("Tessera non trovata",HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleUserNotFoundException(UserNotFoundException e) {
        return new ResponseEntity<>("Utente non trovato",HttpStatus.NOT_FOUND);
    }

    @PreAuthorize("hasRole('utente')")
    @PostMapping
    public ResponseEntity<?> createTessera(@RequestBody @Valid TesseraLibreria tessera) {
        try {
            System.out.println("=== CREAZIONE TESSERA ===");
            System.out.println("Tessera ricevuta: " + tessera);
            System.out.println("Tipologia ID: " + (tessera.getTipologia() != null ? tessera.getTipologia().getId() : "null"));
            System.out.println("Utente ID dal token: " + Utils.getId());
            
            return new ResponseEntity<>(tesseraLibreriaService.createTessera(tessera), HttpStatus.CREATED);
        } catch (TipologiaNotFoundException e) {
            System.err.println("Tipologia non trovata: " + e.getMessage());
            return new ResponseEntity<>("Tipologia non trovata", HttpStatus.NOT_FOUND);
        } catch (UserNotFoundException e) {
            System.err.println("Utente non trovato: " + e.getMessage());
            return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.err.println("Errore generico creazione tessera: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>("Errore durante la creazione della tessera: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/tipologie")
    public ResponseEntity<List<TipologiaTessera>> getAllTipologie() {
        return new ResponseEntity<>(tipologiaTesseraService.getAllTipologie(), HttpStatus.OK);
    }
    
    @GetMapping("/tipologie/{id}")
    public ResponseEntity<TipologiaTessera> getTipologiaById(@PathVariable int id) throws TipologiaNotFoundException {
        return new ResponseEntity<>(tipologiaTesseraService.getTipologiaById(id), HttpStatus.OK);
    }
    
    @PreAuthorize("hasRole('admin')")
    @PostMapping("/tipologie")
    public ResponseEntity<?> createTipologia(@RequestBody @Valid TipologiaTessera tipologia) {
        try {
            return new ResponseEntity<>(tipologiaTesseraService.createTipologia(tipologia), HttpStatus.CREATED);
        } catch (TipologiaAlreadyExistException e) {
            return new ResponseEntity<>("Tipologia già esistente", HttpStatus.CONFLICT);
        }
    }
    

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente")
    public ResponseEntity<?> getTessereByUtente() throws UserNotFoundException {
        Utente utente = utenteService.cercaUtente(Utils.getId());//prendo l'id dal token jwt
        return new ResponseEntity<>(tesseraLibreriaService.getTessereByUtente(utente), HttpStatus.OK);//se non ce ne sono restituisce lista vuota
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente/concrediti")
    public ResponseEntity<?> getTessereByUtenteWithPositiveCrediti() throws UserNotFoundException {
        Utente utente = utenteService.cercaUtente(Utils.getId());
        return new ResponseEntity<>(tesseraLibreriaService.getTessereUtenteConCrediti(utente), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('admin')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTessera(@PathVariable int id) {
        tesseraLibreriaService.deleteTessera(id);
        return ResponseEntity.ok().build();
    }
    
    @PreAuthorize("hasRole('admin')")
    @GetMapping
    public ResponseEntity<?> getAllTessere() {
        try {
            List<TesseraLibreria> tessere = tesseraLibreriaService.getAllTessere();
            return ResponseEntity.ok(tessere);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore durante il caricamento delle tessere: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping("/{id}")
    public ResponseEntity<TesseraLibreria> getTesseraById(@PathVariable int id) throws TesseraNotFoundException {
        return new ResponseEntity<>(tesseraLibreriaService.getTesseraById(id), HttpStatus.OK);
    }
}