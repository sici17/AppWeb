package controller;

import services.*;
import support.ResponseMessage;
import support.exceptions.OrdineNotFoundException;
import support.exceptions.UserNotFoundException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import entities.*;
import jakarta.validation.Valid;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/ordini")
public class OrdineController {

    private final OrdineService ordineService;

    public OrdineController(OrdineService ordineService) {
        this.ordineService = ordineService;
    }

    @PreAuthorize("hasRole('utente')")
    @PostMapping
    public ResponseEntity<?> salvaOrdine(@RequestBody @Valid Ordine ordine) {
        Ordine savedOrdine = ordineService.salvaOrdine(ordine);
        return new ResponseEntity<>(savedOrdine, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping
    public ResponseEntity<List<Ordine>> trovaTuttiGliOrdini() {
        List<Ordine> ordini = ordineService.trovaTuttiGliOrdini();
        return new ResponseEntity<>(ordini, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/data")
    public ResponseEntity<List<Ordine>> filtraPerData(@RequestParam Date inizio, @RequestParam Date fine) {
        List<Ordine> ordini = ordineService.filtraPerData(inizio, fine);
        return new ResponseEntity<>(ordini, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('utente')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminaOrdine(@PathVariable int id) {
        try {
            ordineService.eliminaOrdine(id);
            return new ResponseEntity<>(new ResponseMessage("Ordine eliminato"), HttpStatus.OK);
        } catch (OrdineNotFoundException e) {
            return new ResponseEntity<>(new ResponseMessage("Ordine non trovato"), HttpStatus.NOT_FOUND);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/ordiniUtente")
    public ResponseEntity<?> trovaOrdinePerUtente() {
        try {
            List<Ordine> ordine = ordineService.trovaOrdinePerUtente();
            return new ResponseEntity<>(ordine, HttpStatus.OK);
        } catch (OrdineNotFoundException e) {
            return new ResponseEntity<>(new ResponseMessage("Ordine non trovato per l'utente"), HttpStatus.NOT_FOUND);
        } catch (UserNotFoundException e) {
            return new ResponseEntity<>(new ResponseMessage("Utente non trovato"), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(new ResponseMessage("Errore ordini dell'utente"), HttpStatus.BAD_REQUEST);
        }
    }
}
