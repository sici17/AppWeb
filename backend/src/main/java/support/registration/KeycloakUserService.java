package support.registration;

import support.exceptions.*;
import org.springframework.http.ResponseEntity;

public interface KeycloakUserService {

    ResponseEntity<?> createUser(UserRegistrationRecord userRegistrationRecord) throws ErroreRegistrazione;

}