package controller;

import support.auth.Utils;
import support.exceptions.*;
import entities.*;
import jakarta.validation.Valid;
import services.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tessere")
public class TipologiaTesseraController {

    private final TesseraLibreriaService tesseraLibreriaService;
    private final UtenteService utenteService;

    @Autowired
    public TipologiaTesseraController(TesseraLibreriaService tesseraLibreriaService, UtenteService utenteService) {
        this.tesseraLibreriaService = tesseraLibreriaService;
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
            return new ResponseEntity<>(tesseraLibreriaService.createTessera(tessera), HttpStatus.CREATED);
        } catch (TipologiaNotFoundException e) {
            return new ResponseEntity<>("Tipologia non trovata", HttpStatus.NOT_FOUND);
        } catch (UserNotFoundException e) {
            return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
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
    public List<TesseraLibreria> getAllTessere() {
        return tesseraLibreriaService.getAllTessere();
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping("/{id}")
    public ResponseEntity<TesseraLibreria> getTesseraById(@PathVariable int id) throws TesseraNotFoundException {
        return new ResponseEntity<>(tesseraLibreriaService.getTesseraById(id), HttpStatus.OK);
    }
}
