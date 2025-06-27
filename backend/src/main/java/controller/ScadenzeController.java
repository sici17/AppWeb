package controller;

import services.ScadenzaService;
import entities.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scadenze")
@PreAuthorize("hasRole('admin')")  // applicato a tutto il controller
public class ScadenzeController {

    @Autowired
    private ScadenzaService scadenzeService;

    @PostMapping("/controllo-manuale")
    public ResponseEntity<Map<String, Object>> eseguiControlloManuale() {
        return executeWithErrorHandling(() -> scadenzeService.eseguiControlloManuale());
    }

    @GetMapping("/tessere-scadenza/{giorni}")
    public ResponseEntity<Map<String, Object>> getTessereInScadenza(@PathVariable int giorni) {
        return executeWithErrorHandling(() -> {
            List<TesseraLibreria> tessere = scadenzeService.getTessereInScadenzaEntro(giorni);
            return createResponse("tessereInScadenza", tessere, giorni);
        });
    }

    @GetMapping("/prestiti-scadenza/{giorni}")
    public ResponseEntity<Map<String, Object>> getPrestitiInScadenza(@PathVariable int giorni) {
        return executeWithErrorHandling(() -> {
            List<Prestito> prestiti = scadenzeService.getPrestitiInScadenzaEntro(giorni);
            return createResponse("prestitiInScadenza", prestiti, giorni);
        });
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardScadenze() {
        return executeWithErrorHandling(() -> {
            Map<String, Object> dashboard = new HashMap<>();
            
            // tessere
            dashboard.put("tessere", Map.of(
                "scadenzaEntro7giorni", scadenzeService.getTessereInScadenzaEntro(7).size(),
                "scadenzaEntro30giorni", scadenzeService.getTessereInScadenzaEntro(30).size(),
                "dettaglio7giorni", scadenzeService.getTessereInScadenzaEntro(7)
            ));
            
            // prestiti
            dashboard.put("prestiti", Map.of(
                "scadenzaEntro3giorni", scadenzeService.getPrestitiInScadenzaEntro(3).size(),
                "scadenzaEntro7giorni", scadenzeService.getPrestitiInScadenzaEntro(7).size(),
                "dettaglio3giorni", scadenzeService.getPrestitiInScadenzaEntro(3)
            ));
            
            dashboard.put("timestamp", new Date());
            return dashboard;
        });
    }

    @PostMapping("/aggiorna-stati")
    public ResponseEntity<Map<String, Object>> forzaAggiornamentoStati() {
        return executeWithErrorHandling(() -> {
            scadenzeService.aggiornaStatoTessereScadute();
            scadenzeService.aggiornaStatoPrestitiScaduti();
            
            return Map.of(
                "message", "Stati aggiornati con successo",
                "tessereAggiornate", scadenzeService.getTessereInScadenzaEntro(-1).size(),
                "prestitiAggiornati", scadenzeService.getPrestitiInScadenzaEntro(-1).size(),
                "timestamp", new Date()
            );
        });
    }

    @PostMapping("/calcola-multe")
    public ResponseEntity<Map<String, Object>> calcolaMulte() {
        return executeWithErrorHandling(() -> {
            scadenzeService.calcolaMultePrestitiInRitardo();
            return createSuccessResponse("Multe calcolate con successo");
        });
    }

    @PostMapping("/rinnovi-automatici")
    public ResponseEntity<Map<String, Object>> eseguiRinnoviAutomatici() {
        return executeWithErrorHandling(() -> {
            scadenzeService.rinnovaTessereAutomatiche();
            return createSuccessResponse("Rinnovi automatici eseguiti");
        });
    }

    @PostMapping("/invia-notifiche")
    public ResponseEntity<Map<String, Object>> inviaNotifiche() {
        return executeWithErrorHandling(() -> {
            scadenzeService.inviaNotificheScadenzeImminenti();
            return createSuccessResponse("Notifiche inviate");
        });
    }

  

    // metodi di utilità privati
    private ResponseEntity<Map<String, Object>> executeWithErrorHandling(SupplierWithException<Map<String, Object>> supplier) {
        try {
            return ResponseEntity.ok(supplier.get());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "error", "Errore durante l'operazione: " + e.getMessage(),
                    "timestamp", new Date(),
                    "sistemaFunzionante", false
                ));
        }
    }

    private Map<String, Object> createResponse(String key, List<?> items, int giorni) {
        return Map.of(
            key, items,
            "numero" + key.substring(0, 1).toUpperCase() + key.substring(1), items.size(),
            "giorniLimite", giorni
        );
    }

    private Map<String, Object> createSuccessResponse(String message) {
        return Map.of(
            "message", message,
            "timestamp", new Date()
        );
    }

    @FunctionalInterface
    private interface SupplierWithException<T> {
        T get() throws Exception;
    }
}