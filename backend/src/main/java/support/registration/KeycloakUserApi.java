package support.registration;

import support.exceptions.*;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/users")
@AllArgsConstructor
public class KeycloakUserApi {

    private final KeycloakUserService keycloakUserService;


    @PostMapping("/registrazione")
    public ResponseEntity<?> createUser(@RequestBody UserRegistrationRecord userRegistrationRecord) throws ErroreRegistrazione {
        return keycloakUserService.createUser(userRegistrationRecord);
    }


}
