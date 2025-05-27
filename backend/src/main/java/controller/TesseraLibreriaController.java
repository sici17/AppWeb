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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    
    
    
    
    
 // Aggiungi questi endpoint nel TesseraLibreriaController

    @PreAuthorize("hasRole('admin')")
    @PutMapping("/admin/{tesseraId}/sospendi")
    public ResponseEntity<?> sospendiTessera(@PathVariable int tesseraId, @RequestBody(required = false) Map<String, String> body) {
        try {
            String motivo = body != null ? body.get("motivo") : "Sospesa dall'amministratore";
            
            System.out.println("=== INIZIO SOSPENSIONE TESSERA ===");
            System.out.println("ID Tessera da sospendere: " + tesseraId);
            
            TesseraLibreria tessera = tesseraLibreriaService.getTesseraById(tesseraId);
            System.out.println("Tessera trovata - Stato attuale: " + tessera.getStato());
            
            if (tessera.getStato() != TesseraLibreria.StatoTessera.ATTIVA) {
                System.out.println("ERRORE: Tessera non attiva - Stato: " + tessera.getStato());
                return new ResponseEntity<>("La tessera deve essere attiva per essere sospesa. Stato attuale: " + tessera.getStato(), HttpStatus.BAD_REQUEST);
            }
            
            // Cambia stato PRIMA del salvataggio
            System.out.println("Cambiando stato da " + tessera.getStato() + " a SOSPESA");
            tessera.setStato(TesseraLibreria.StatoTessera.SOSPESA);
            
            // Salva e verifica
            TesseraLibreria tesseraSalvata = tesseraLibreriaService.saveTessera(tessera);
            System.out.println("Tessera salvata - Nuovo stato: " + tesseraSalvata.getStato());
            System.out.println("ID tessera salvata: " + tesseraSalvata.getId());
            
            // Verifica immediata ricaricando dal DB
            TesseraLibreria tesseraVerifica = tesseraLibreriaService.getTesseraById(tesseraId);
            System.out.println("VERIFICA: Stato nel DB dopo salvataggio: " + tesseraVerifica.getStato());
            
            System.out.println("=== TESSERA SOSPESA CON SUCCESSO ===");
            System.out.println("Utente: " + tessera.getUtente().getNome() + " " + tessera.getUtente().getCognome());
            System.out.println("Motivo: " + motivo);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Tessera sospesa con successo");
            response.put("tessera", tesseraVerifica); // Restituisci la tessera verificata
            response.put("motivo", motivo);
            response.put("statoVerificato", tesseraVerifica.getStato());
            
            return ResponseEntity.ok(response);
            
        } catch (TesseraNotFoundException e) {
            System.err.println("ERRORE: Tessera non trovata con ID: " + tesseraId);
            return new ResponseEntity<>("Tessera non trovata", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.err.println("ERRORE durante sospensione tessera: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore durante la sospensione: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('admin')")
    @PutMapping("/admin/{tesseraId}/riattiva")
    public ResponseEntity<?> riattivaTessera(@PathVariable int tesseraId, @RequestBody(required = false) Map<String, String> body) {
        try {
            String note = body != null ? body.get("note") : "Riattivata dall'amministratore";
            
            TesseraLibreria tessera = tesseraLibreriaService.getTesseraById(tesseraId);
            
            if (tessera.getStato() != TesseraLibreria.StatoTessera.SOSPESA) {
                return new ResponseEntity<>("La tessera deve essere sospesa per essere riattivata", HttpStatus.BAD_REQUEST);
            }
            
            // Riattiva la tessera
            tessera.setStato(TesseraLibreria.StatoTessera.ATTIVA);
            tesseraLibreriaService.saveTessera(tessera);
            
            System.out.println("=== TESSERA RIATTIVATA ===");
            System.out.println("ID Tessera: " + tesseraId);
            System.out.println("Utente: " + tessera.getUtente().getNome() + " " + tessera.getUtente().getCognome());
            System.out.println("Note: " + note);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Tessera riattivata con successo");
            response.put("tessera", tessera);
            response.put("note", note);
            
            return ResponseEntity.ok(response);
            
        } catch (TesseraNotFoundException e) {
            return new ResponseEntity<>("Tessera non trovata", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore durante la riattivazione: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('admin')")
    @PutMapping("/admin/{tesseraId}/stato")
    public ResponseEntity<?> cambiaStatoTessera(@PathVariable int tesseraId, @RequestBody Map<String, String> body) {
        try {
            String nuovoStato = body.get("stato");
            String motivo = body.get("motivo");
            
            if (nuovoStato == null || nuovoStato.trim().isEmpty()) {
                return new ResponseEntity<>("Stato richiesto", HttpStatus.BAD_REQUEST);
            }
            
            TesseraLibreria tessera = tesseraLibreriaService.getTesseraById(tesseraId);
            
            // Valida il nuovo stato
            TesseraLibreria.StatoTessera statoEnum;
            try {
                statoEnum = TesseraLibreria.StatoTessera.valueOf(nuovoStato.toUpperCase());
            } catch (IllegalArgumentException e) {
                return new ResponseEntity<>("Stato non valido: " + nuovoStato, HttpStatus.BAD_REQUEST);
            }
            
            TesseraLibreria.StatoTessera statoVecchio = tessera.getStato();
            tessera.setStato(statoEnum);
            tesseraLibreriaService.saveTessera(tessera);
            
            System.out.println("=== CAMBIO STATO TESSERA ===");
            System.out.println("ID Tessera: " + tesseraId);
            System.out.println("Stato precedente: " + statoVecchio);
            System.out.println("Nuovo stato: " + statoEnum);
            System.out.println("Motivo: " + motivo);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Stato tessera aggiornato con successo");
            response.put("tessera", tessera);
            response.put("statoVecchio", statoVecchio);
            response.put("nuovoStato", statoEnum);
            response.put("motivo", motivo);
            
            return ResponseEntity.ok(response);
            
        } catch (TesseraNotFoundException e) {
            return new ResponseEntity<>("Tessera non trovata", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore durante il cambio stato: " + e.getMessage());
        }
    }
    
}