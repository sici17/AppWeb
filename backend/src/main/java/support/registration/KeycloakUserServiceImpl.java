// backend/src/main/java/support/registration/KeycloakUserServiceImpl.java - VERSIONE CORRETTA
package support.registration;

import jakarta.transaction.Transactional;
import repositories.UtenteRepository;
import support.exceptions.ErroreRegistrazione;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import entities.Utente;

import java.util.*;

@Service
public class KeycloakUserServiceImpl implements KeycloakUserService {

    @Autowired
    private UtenteRepository utenteRepository;

    @Override
    @Transactional(rollbackOn = Exception.class)
    public ResponseEntity<?> createUser(UserRegistrationRecord userRegistrationRecord) throws ErroreRegistrazione {

        if (userRegistrationRecord == null) {
            throw new ErroreRegistrazione();
        }
        
        try {
            //verifica duplicati email
            if (utenteRepository.existsByEmail(userRegistrationRecord.email())) {
                System.err.println("Email già registrata: " + userRegistrationRecord.email());
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Email già registrata");
                errorResponse.put("email", userRegistrationRecord.email());
                return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
            }
            
            // Crea l'utente nel database
            Utente u = new Utente();
            u.setNome(userRegistrationRecord.firstName());
            u.setCognome(userRegistrationRecord.lastName());
            u.setEmail(userRegistrationRecord.email()); // 🔧 IMPORTANTE: Usa la stessa email di Keycloak
            u.setTessere(new ArrayList<>());
            u.setPrestiti(new ArrayList<>());
            u.setSesso(userRegistrationRecord.sesso());
            u.setTipoUtente(Utente.TipoUtente.STUDENTE); // Default
            
            // u.setMatricola(generateMatricola()); // Se vuoi generare una matricola
            
            // Salva l'utente
            Utente utente_salvato = utenteRepository.save(u);
      
            
            // Restituisci risposta di successo
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Utente registrato con successo");
            response.put("user", utente_salvato);
            response.put("keycloakUsername", userRegistrationRecord.username());
            response.put("linkedEmail", utente_salvato.getEmail());
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
            
        } catch (Exception e) {
            System.err.println("❌ Errore durante la registrazione: " + e.getMessage());
            e.printStackTrace();
            throw new ErroreRegistrazione();
        }
    }
    
}