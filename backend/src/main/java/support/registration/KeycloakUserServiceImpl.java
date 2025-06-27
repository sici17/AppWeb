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
          
            
            // crea l'utente nel database
            Utente u = new Utente();
            u.setNome(userRegistrationRecord.firstName());
            u.setCognome(userRegistrationRecord.lastName());
            u.setEmail(userRegistrationRecord.email()); 
            u.setTessere(new ArrayList<>());
            u.setPrestiti(new ArrayList<>());
            u.setSesso(userRegistrationRecord.sesso());
            u.setTipoUtente(Utente.TipoUtente.STUDENTE); // Default
            
            
            Utente utente_salvato = utenteRepository.save(u);
      
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "utente registrato con successo");
            response.put("user", utente_salvato);
            response.put("keycloakUsername", userRegistrationRecord.username());
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
            
        } catch (Exception e) {
            System.err.println(" errore durante la registrazione: " + e.getMessage());
            e.printStackTrace();
            throw new ErroreRegistrazione();
        }
    }
    
}