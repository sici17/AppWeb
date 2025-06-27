package support.auth;

import lombok.experimental.UtilityClass;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@UtilityClass
@Log4j2
public class Utils {



    
    public static String getEmail() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null) {
                throw new IllegalStateException("utente non autenticato");
            }
            
            
            if (authentication instanceof JwtAuthenticationToken jwtAuthToken) {
                Jwt jwt = (Jwt) jwtAuthToken.getCredentials();
                
                String email = jwt.getClaimAsString("email");
                if (email != null && !email.isEmpty()) {
                    return email;
                }
                
                throw new IllegalStateException("email non trovata nel token");
            }
            
            throw new IllegalStateException("tipo di autenticazione non valido");
            
        } catch (Exception e) {
            throw new IllegalStateException("email non trovata");
        }
    }

   
}