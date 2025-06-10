package controller;

import support.exceptions.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import entities.*;
import jakarta.validation.Valid;
import services.RisorsaService;

import java.util.List;

@RestController
@RequestMapping("/api/risorse")
public class RisorsaController {
    private final RisorsaService risorsaService;

    @Autowired
    public RisorsaController(RisorsaService risorsaService) {
        this.risorsaService = risorsaService;
    }

 

    @GetMapping
    public ResponseEntity<List<Risorsa>> getAll() {
        return new ResponseEntity<>(risorsaService.getAllRisorse(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Risorsa> getById(@PathVariable int id) throws RisorsaNotFoundException {
        return new ResponseEntity<>(risorsaService.getRisorsaById(id), HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Risorsa>> findByTitolo(@RequestParam String titolo) {
        List<Risorsa> risorse = risorsaService.getRisorseContainingTitolo(titolo);
        return new ResponseEntity<>(risorse, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('admin')")
    @PostMapping
    public ResponseEntity<?> create(@RequestBody @Valid Risorsa risorsa) {
        try{
            Risorsa ret = risorsaService.createRisorsa(risorsa);
            return new ResponseEntity<>(ret, HttpStatus.CREATED);
        } catch (RisorsaAlreadyExistsException e) {
            return new ResponseEntity<>("La risorsa già esiste", HttpStatus.BAD_REQUEST);
        }
    }

    @PreAuthorize("hasRole('admin')")
    @PutMapping("/{id}")
    public ResponseEntity<String> update(@PathVariable int id, @RequestBody @Valid Risorsa risorsa) throws RisorsaNotFoundException {
        risorsaService.updateRisorsa(id, risorsa);
        return new ResponseEntity<>("Risorsa aggiornata con successo", HttpStatus.OK);
    }

    @PreAuthorize("hasRole('admin')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable int id) throws RisorsaNotFoundException {
        risorsaService.deleteRisorsa(id);
        return new ResponseEntity<>("Risorsa eliminata con successo", HttpStatus.OK);
    }
}