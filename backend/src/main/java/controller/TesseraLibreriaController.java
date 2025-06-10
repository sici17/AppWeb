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

    @SuppressWarnings("deprecation")
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
        try {
            // 🔧 CORRETTO: Usa il nuovo metodo per ottenere l'utente corrente
            Utente utente = utenteService.getUtenteCorrente();
            System.out.println("✅ Richiesta tessere per utente:");
            System.out.println("   ID: " + utente.getId());
            System.out.println("   Nome: " + utente.getNome() + " " + utente.getCognome());
            System.out.println("   Email: " + utente.getEmail());
            
            List<TesseraLibreria> tessere = tesseraLibreriaService.getTessereByUtente(utente);
            System.out.println("   Tessere trovate: " + tessere.size());
            
            // Debug: mostra dettagli tessere
            for (TesseraLibreria tessera : tessere) {
                System.out.println("   - Tessera ID: " + tessera.getId() + 
                                 ", Tipologia: " + tessera.getTipologia().getNome() +
                                 ", Stato: " + tessera.getStato() +
                                 ", Crediti: " + tessera.getCreditiRimanenti());
            }
            
            return new ResponseEntity<>(tessere, HttpStatus.OK);
            
        } catch (UserNotFoundException e) {
            System.err.println("❌ Utente corrente non trovato per tessere");
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Errore generico nel caricamento tessere: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore nel caricamento tessere: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping("/utente/concrediti")
    public ResponseEntity<?> getTessereByUtenteWithPositiveCrediti() throws UserNotFoundException {
        try {
            // 🔧 CORRETTO: Usa il nuovo metodo per ottenere l'utente corrente
            Utente utente = utenteService.getUtenteCorrente();
            System.out.println("✅ Richiesta tessere con crediti per utente:");
            System.out.println("   Email: " + utente.getEmail());
            
            List<TesseraLibreria> tessereConCrediti = tesseraLibreriaService.getTessereUtenteConCrediti(utente);
            System.out.println("   Tessere con crediti: " + tessereConCrediti.size());
            
            return new ResponseEntity<>(tessereConCrediti, HttpStatus.OK);
            
        } catch (UserNotFoundException e) {
            System.err.println("❌ Utente corrente non trovato per tessere con crediti");
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Errore nel caricamento tessere con crediti: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore nel caricamento tessere con crediti: " + e.getMessage());
        }
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
    
    @PreAuthorize("hasRole('utente')")
    @GetMapping("/tipologie/disponibili")
    public ResponseEntity<?> getTipologieDisponibili() {
        try {
            // 🔧 CORRETTO: Usa il nuovo metodo per ottenere l'utente corrente
            Utente utente = utenteService.getUtenteCorrente();
            System.out.println("=== RICHIESTA TIPOLOGIE DISPONIBILI ===");
            System.out.println("Utente: " + utente.getNome() + " " + utente.getCognome());
            System.out.println("Tipo utente: " + utente.getTipoUtente());
            System.out.println("Email: " + utente.getEmail());
            
            List<TipologiaTessera> tipologieDisponibili = 
                    tipologiaTesseraService.getTipologiePerTipoUtente(utente.getTipoUtente());
            
            System.out.println("Tipologie restituite: " + tipologieDisponibili.size());
            
            return ResponseEntity.ok(tipologieDisponibili);
            
        } catch (UserNotFoundException e) {
            System.err.println("Utente non trovato per tipologie disponibili");
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Utente non trovato");
        } catch (Exception e) {
            System.err.println("Errore nel recupero tipologie disponibili: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore nel caricamento delle tipologie disponibili");
        }
    }
    
    
    

    
    
    
    
    @PreAuthorize("hasRole('utente')")
    @PostMapping("/richiedi")
    public ResponseEntity<?> richiedeTessera(@RequestBody Map<String, Object> request) {
        try {
            int tipologiaId = (Integer) request.get("tipologiaId");
            String note = (String) request.getOrDefault("note", "");
            
            TipologiaTessera tipologia = tipologiaTesseraService.getTipologiaById(tipologiaId);
            TesseraLibreria richiesta = tesseraLibreriaService.richiedeTessera(tipologia, note);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Richiesta tessera inviata con successo. In attesa di approvazione.");
            response.put("richiesta", richiesta);
            
            return ResponseEntity.ok(response);
            
        } catch (TipologiaNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Tipologia non trovata");
        } catch (TipologiaAlreadyExistException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore durante la richiesta: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping("/admin/richieste")
    public ResponseEntity<?> getRichiesteInAttesa() {
        try {
            System.out.println("=== RICHIESTA RICHIESTE IN ATTESA ===");
            
            // 🔧 USA IL REPOSITORY CORRETTAMENTE
            List<TesseraLibreria> richieste = tesseraLibreriaService.getRichiesteInAttesa();
            
            System.out.println("Richieste trovate: " + richieste.size());
            
            // Debug: mostra le richieste trovate
            for (TesseraLibreria richiesta : richieste) {
                System.out.println("- ID: " + richiesta.getId() + 
                                 ", Utente: " + richiesta.getUtente().getNome() + " " + richiesta.getUtente().getCognome() +
                                 ", Tipologia: " + richiesta.getTipologia().getNome() +
                                 ", Stato: " + richiesta.getStato() +
                                 ", Data richiesta: " + richiesta.getDataRichiesta());
            }
            
            return ResponseEntity.ok(richieste);
            
        } catch (Exception e) {
            System.err.println("❌ Errore caricamento richieste in attesa: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore caricamento richieste: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('admin')")
    @PutMapping("/admin/{richiestaId}/approva")
    public ResponseEntity<?> approvaTessera(@PathVariable int richiestaId, 
                                            @RequestBody(required = false) Map<String, String> body) {
        try {
            String note = body != null ? body.get("note") : "Approvata dall'amministratore";
            
            System.out.println("=== APPROVAZIONE TESSERA ===");
            System.out.println("ID Richiesta: " + richiestaId);
            System.out.println("Note admin: " + note);
            
            TesseraLibreria tesseraApprovata = tesseraLibreriaService.approvaTessera(richiestaId, note);
            
            System.out.println("✅ Tessera approvata con successo:");
            System.out.println("   - ID tessera: " + tesseraApprovata.getId());
            System.out.println("   - Nuovo stato: " + tesseraApprovata.getStato());
            System.out.println("   - Crediti assegnati: " + tesseraApprovata.getCreditiRimanenti());
            System.out.println("   - Numero tessera: " + tesseraApprovata.getNumeroTessera());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Tessera approvata e attivata con successo");
            response.put("tessera", tesseraApprovata);
            response.put("statoVerificato", tesseraApprovata.getStato());
            
            return ResponseEntity.ok(response);
            
        } catch (TesseraNotFoundException e) {
            System.err.println("❌ Richiesta non trovata con ID: " + richiestaId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Richiesta non trovata");
        } catch (IllegalStateException e) {
            System.err.println("❌ Stato richiesta non valido: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Errore durante approvazione: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore durante l'approvazione: " + e.getMessage());
        }
    }


    @PreAuthorize("hasRole('admin')")
    @PutMapping("/admin/{richiestaId}/rifiuta")
    public ResponseEntity<?> rifiutaTessera(@PathVariable int richiestaId,
                                            @RequestBody Map<String, String> body) {
        try {
            String motivo = body.get("motivo");
            if (motivo == null || motivo.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Motivo del rifiuto richiesto");
            }
            
            System.out.println("=== RIFIUTO TESSERA ===");
            System.out.println("ID Richiesta: " + richiestaId);
            System.out.println("Motivo: " + motivo);
            
            TesseraLibreria tesseraRifiutata = tesseraLibreriaService.rifiutaTessera(richiestaId, motivo);
            
            System.out.println("❌ Tessera rifiutata:");
            System.out.println("   - ID tessera: " + tesseraRifiutata.getId());
            System.out.println("   - Nuovo stato: " + tesseraRifiutata.getStato());
            System.out.println("   - Motivo: " + motivo);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Richiesta tessera rifiutata");
            response.put("tessera", tesseraRifiutata);
            response.put("motivo", motivo);
            
            return ResponseEntity.ok(response);
            
        } catch (TesseraNotFoundException e) {
            System.err.println("❌ Richiesta non trovata con ID: " + richiestaId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Richiesta non trovata");
        } catch (IllegalStateException e) {
            System.err.println("❌ Stato richiesta non valido: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Errore durante rifiuto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore durante il rifiuto: " + e.getMessage());
        }
    }
    
    
    @SuppressWarnings("deprecation")
    @PreAuthorize("hasRole('admin')")
    @GetMapping("/admin/debug")
    public ResponseEntity<?> debugAdmin() {
        try {
            System.out.println("=== DEBUG ADMIN ENDPOINT ===");
            
            // Statistiche base
            List<TesseraLibreria> tutteLeTessere = tesseraLibreriaService.getAllTessere();
            List<TesseraLibreria> richiestePending = tesseraLibreriaService.getRichiesteInAttesa();
            
            Map<String, Object> debug = new HashMap<>();
            debug.put("totaleTessere", tutteLeTessere.size());
            debug.put("richiesteInAttesa", richiestePending.size());
            debug.put("adminId", Utils.getId());
            debug.put("timestamp", new Date());
            
            // Raggruppa tessere per stato
            Map<String, Long> tesserePerStato = tutteLeTessere.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    t -> t.getStato().toString(),
                    java.util.stream.Collectors.counting()
                ));
            debug.put("tesserePerStato", tesserePerStato);
            
            System.out.println("Debug info generato: " + debug);
            
            return ResponseEntity.ok(debug);
            
        } catch (Exception e) {
            System.err.println("❌ Errore debug admin: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Errore debug: " + e.getMessage());
        }
    }
    
    
    
    
    
}