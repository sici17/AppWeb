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
            System.out.println("=== REGISTRAZIONE UTENTE (SOLO DATABASE) ===");
            System.out.println("Username: " + userRegistrationRecord.username());
            System.out.println("Email: " + userRegistrationRecord.email());
            System.out.println("Nome: " + userRegistrationRecord.firstName() + " " + userRegistrationRecord.lastName());
            
            // Crea l'utente nel database
            Utente u = new Utente();
            u.setNome(userRegistrationRecord.firstName());
            u.setCognome(userRegistrationRecord.lastName());
            u.setEmail(userRegistrationRecord.email());
            u.setTessere(new ArrayList<>());
            u.setPrestiti(new ArrayList<>());
            u.setSesso(userRegistrationRecord.sesso());
            u.setTipoUtente(Utente.TipoUtente.STUDENTE);
            
            // Salva l'utente
            Utente utente_salvato = utenteRepository.save(u);
            System.out.println("Utente salvato nel database con ID: " + utente_salvato.getId());
            
            // Crea il carrello
           

            System.out.println("=== REGISTRAZIONE COMPLETATA CON SUCCESSO ===");
            
            // Restituisci risposta di successo
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Utente registrato con successo");
            response.put("user", utente_salvato);
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
            
        } catch (Exception e) {
            System.err.println("Errore durante la registrazione: " + e.getMessage());
            e.printStackTrace();
            throw new ErroreRegistrazione();
        }
    }
}