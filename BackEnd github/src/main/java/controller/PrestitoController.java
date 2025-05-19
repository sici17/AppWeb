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
        try{
            Prestito ret = prestitoService.create(prestito);
            return new ResponseEntity<>(ret, HttpStatus.CREATED);
        } catch (RisorsaFullException e) {
            return new ResponseEntity<>("Risorsa non disponibile", HttpStatus.BAD_REQUEST);
        } catch (RisorsaNotFoundException e) {
            return new ResponseEntity<>("Risorsa non trovata", HttpStatus.NOT_FOUND);
        } catch (PrestitoAlreadyExistsException e) {
            return new ResponseEntity<>("Prestito già esistente", HttpStatus.CONFLICT);
        } catch (UserNotFoundException e) {
            return new ResponseEntity<>("Utente non trovato", HttpStatus.NOT_FOUND);
        } catch (InsufficientCreditsException e) {
            return new ResponseEntity<>("Crediti insufficienti", HttpStatus.PRECONDITION_FAILED);
        } catch (PrestitoNotValidException e) {
            return new ResponseEntity<>("Impossibile prenotare per una data passata", HttpStatus.BAD_REQUEST);
        } catch (Exception e){
            e.printStackTrace();//stampo errore ma è visibile solo da backend, lo uso per debug
            return new ResponseEntity<>("Errore generico", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente/future")
    public ResponseEntity<?> getFutureUtente(){
        try{
            return new ResponseEntity<>(prestitoService.getPrestitiUtenteFuture(),HttpStatus.OK);
        } catch (UserNotFoundException e) {
            return new ResponseEntity<>("Utente non trovato",HttpStatus.NOT_FOUND);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente")
    public ResponseEntity<?> getAllUtente(){
        try{
            return new ResponseEntity<>(prestitoService.getPrestitiUtente(),HttpStatus.OK);
        } catch (UserNotFoundException e) {
            return new ResponseEntity<>("Utente non trovato",HttpStatus.NOT_FOUND);
        }
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping
    public List<Prestito> getAll() {
        return prestitoService.findAll();
    }
}