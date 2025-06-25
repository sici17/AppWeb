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

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tessere")
public class TesseraLibreriaController {

    private final TesseraLibreriaService tesseraService;
    private final TipologiaTesseraService tipologiaService;
    private final UtenteService utenteService;

    public TesseraLibreriaController(TesseraLibreriaService tesseraService, 
            TipologiaTesseraService tipologiaService, UtenteService utenteService) {
        this.tesseraService = tesseraService;
        this.tipologiaService = tipologiaService;
        this.utenteService = utenteService;
    }

    @ExceptionHandler({TesseraNotFoundException.class, UserNotFoundException.class, TipologiaNotFoundException.class})
    public ResponseEntity<String> handleNotFound(RuntimeException e) { 
        return ResponseEntity.notFound().build(); 
    }

    @ExceptionHandler(TipologiaAlreadyExistException.class)
    public ResponseEntity<String> handleConflict(TipologiaAlreadyExistException e) { 
        return ResponseEntity.status(HttpStatus.CONFLICT).build(); 
    }

    // CRUD Base
    @PreAuthorize("hasRole('utente')") @PostMapping
    public ResponseEntity<TesseraLibreria> create(@RequestBody @Valid TesseraLibreria tessera) throws UserNotFoundException, TipologiaNotFoundException, TipologiaAlreadyExistException { 
        return ResponseEntity.status(HttpStatus.CREATED).body(tesseraService.createTessera(tessera)); 
    }

    @PreAuthorize("hasRole('admin')") @GetMapping
    public List<TesseraLibreria> getAll() { return tesseraService.getAllTessere(); }

    @PreAuthorize("hasRole('admin')") @GetMapping("/{id}")
    public TesseraLibreria getById(@PathVariable int id) throws TesseraNotFoundException { return tesseraService.getTesseraById(id); }

    @PreAuthorize("hasRole('admin')") @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) { 
        tesseraService.deleteTessera(id); return ResponseEntity.ok().build(); 
    }

    // User Operations
    @PreAuthorize("hasRole('utente')") @GetMapping("/utente")
    public List<TesseraLibreria> getUserTessere() throws UserNotFoundException { 
        return tesseraService.getTessereByUtente(utenteService.getUtenteCorrente()); 
    }

    @PreAuthorize("hasRole('utente')") @GetMapping("/utente/concrediti")
    public List<TesseraLibreria> getUserTessereWithCredits() throws UserNotFoundException { 
        return tesseraService.getTessereUtenteConCrediti(utenteService.getUtenteCorrente()); 
    }

    // Tipologie
    @GetMapping("/tipologie") 
    public List<TipologiaTessera> getAllTipologie() { return tipologiaService.getAllTipologie(); }

    @GetMapping("/tipologie/{id}")
    public TipologiaTessera getTipologia(@PathVariable int id) throws TipologiaNotFoundException { return tipologiaService.getTipologiaById(id); }

    @PreAuthorize("hasRole('admin')") @PostMapping("/tipologie")
    public ResponseEntity<TipologiaTessera> createTipologia(@RequestBody @Valid TipologiaTessera tipologia) throws TipologiaAlreadyExistException { 
        return ResponseEntity.status(HttpStatus.CREATED).body(tipologiaService.createTipologia(tipologia)); 
    }

    @PreAuthorize("hasRole('utente')") @GetMapping("/tipologie/disponibili")
    public List<TipologiaTessera> getTipologieDisponibili() throws UserNotFoundException { 
        return tipologiaService.getTipologiePerTipoUtente(utenteService.getUtenteCorrente().getTipoUtente()); 
    }

    // Stato Operations
    @PreAuthorize("hasRole('admin')") @PutMapping("/admin/{id}/sospendi")
    public Map<String, Object> sospendi(@PathVariable int id, @RequestBody(required = false) Map<String, String> body) throws TesseraNotFoundException { 
        return cambiaStato(id, TesseraLibreria.StatoTessera.SOSPESA, TesseraLibreria.StatoTessera.ATTIVA, body, "Sospesa"); 
    }

    @PreAuthorize("hasRole('admin')") @PutMapping("/admin/{id}/riattiva")
    public Map<String, Object> riattiva(@PathVariable int id, @RequestBody(required = false) Map<String, String> body) throws TesseraNotFoundException { 
        return cambiaStato(id, TesseraLibreria.StatoTessera.ATTIVA, TesseraLibreria.StatoTessera.SOSPESA, body, "Riattivata"); 
    }

    @PreAuthorize("hasRole('admin')") @PutMapping("/admin/{id}/stato")
    public ResponseEntity<Map<String, Object>> cambiaStato(@PathVariable int id, @RequestBody Map<String, String> body) throws TesseraNotFoundException {
        String statoStr = body.get("stato");
        if (statoStr == null) return ResponseEntity.badRequest().body(Map.of("error", "Stato richiesto"));
        
        TesseraLibreria.StatoTessera stato;
        try { stato = TesseraLibreria.StatoTessera.valueOf(statoStr.toUpperCase()); } 
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("error", "Stato non valido")); }

        TesseraLibreria tessera = tesseraService.getTesseraById(id);
        TesseraLibreria.StatoTessera vecchio = tessera.getStato();
        tessera.setStato(stato);
        tesseraService.saveTessera(tessera);

        return ResponseEntity.ok(Map.of("message", "Stato aggiornato", "tessera", tessera, "statoVecchio", vecchio));
    }

    // Richieste
    @PreAuthorize("hasRole('utente')") @PostMapping("/richiedi")
    public Map<String, Object> richiedi(@RequestBody Map<String, Object> request) throws TipologiaNotFoundException, UserNotFoundException, TipologiaAlreadyExistException {
        TipologiaTessera tipologia = tipologiaService.getTipologiaById((Integer) request.get("tipologiaId"));
        TesseraLibreria richiesta = tesseraService.richiedeTessera(tipologia, (String) request.getOrDefault("note", ""));
        return Map.of("message", "Richiesta inviata", "richiesta", richiesta);
    }

    @PreAuthorize("hasRole('admin')") @GetMapping("/admin/richieste")
    public List<TesseraLibreria> getRichieste() { return tesseraService.getRichiesteInAttesa(); }

    @PreAuthorize("hasRole('admin')") @PutMapping("/admin/{id}/approva")
    public Map<String, Object> approva(@PathVariable int id, @RequestBody(required = false) Map<String, String> body) throws TesseraNotFoundException, UserNotFoundException {
        String note = body != null ? body.get("note") : "Approvata";
        TesseraLibreria tessera = tesseraService.approvaTessera(id, note, utenteService.getUtenteCorrente());
        return Map.of("message", "Tessera approvata", "tessera", tessera);
    }

    @PreAuthorize("hasRole('admin')") @PutMapping("/admin/{id}/rifiuta")
    public ResponseEntity<Map<String, Object>> rifiuta(@PathVariable int id, @RequestBody Map<String, String> body) throws TesseraNotFoundException, UserNotFoundException {
        String motivo = body.get("motivo");
        if (motivo == null || motivo.trim().isEmpty()) 
            return ResponseEntity.badRequest().body(Map.of("error", "Motivo richiesto"));
        
        TesseraLibreria tessera = tesseraService.rifiutaTessera(id, motivo, utenteService.getUtenteCorrente());
        return ResponseEntity.ok(Map.of("message", "Richiesta rifiutata", "tessera", tessera));
    }

    @PreAuthorize("hasRole('admin')") @GetMapping("/admin/debug")
    public Map<String, Object> debug() {
        List<TesseraLibreria> tessere = tesseraService.getAllTessere();
        return Map.of(
            "totaleTessere", tessere.size(),
            "richiesteInAttesa", tesseraService.getRichiesteInAttesa().size(),
            "adminId", Utils.getEmail(),
            "timestamp", new Date(),
            "tesserePerStato", tessere.stream().collect(Collectors.groupingBy(t -> t.getStato().toString(), Collectors.counting()))
        );
    }

    // Utilities
    private Map<String, Object> cambiaStato(int id, TesseraLibreria.StatoTessera nuovo, TesseraLibreria.StatoTessera richiesto, 
            Map<String, String> body, String azione) throws TesseraNotFoundException {
        TesseraLibreria tessera = tesseraService.getTesseraById(id);
        if (tessera.getStato() != richiesto) 
            throw new IllegalStateException("Stato non valido per questa operazione");
        
        tessera.setStato(nuovo);
        tesseraService.saveTessera(tessera);
        String motivo = body != null ? body.get("motivo") : azione;
        return Map.of("message", azione + " con successo", "tessera", tessera, "motivo", motivo);
    }
}