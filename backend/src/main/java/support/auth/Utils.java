// backend/src/main/java/support/auth/Utils.java - VERSIONE CORRETTA
package support.auth;

import lombok.experimental.UtilityClass;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@UtilityClass
@Log4j2
public class Utils {

    public static String getUsername() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null) {
                System.err.println("❌ Nessuna autenticazione nel SecurityContext");
                throw new IllegalStateException("Utente non autenticato - effettuare login");
            }
            
            
            // Verifica se è un'autenticazione anonima
            if (authentication.getPrincipal().equals("anonymousUser")) {
                System.err.println("Utente anonimo - richiede login");
                throw new IllegalStateException("Utente non autenticato - effettuare login");
            }

            // Se è un JwtAuthenticationToken, estrai l'username dal JWT
            if (authentication instanceof JwtAuthenticationToken jwtAuthToken) {
                Jwt jwt = (Jwt) jwtAuthToken.getCredentials();
                
                // Prova preferred_username
                String username = jwt.getClaimAsString("preferred_username");
                if (username != null && !username.isEmpty()) {
                    System.out.println("Username trovato: " + username);
                    return username;
                }
                
                String email = jwt.getClaimAsString("email");
                if (email != null && !email.isEmpty()) {
                    System.out.println(" Email usata come username: " + email);
                    return email;
                }
                
                throw new IllegalStateException("Username non trovato nel token");
            }
            
            throw new IllegalStateException("Tipo di autenticazione non valido");
            
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalStateException("Utente non autenticato - effettuare login");
        }
    }

   
    @Deprecated
    public static int getId() {
        // Per compatibilità, mantengo il vecchio metodo ma usa il nuovo approccio
        String username = getUsername();
        
        // Genera un ID consistente dall'username per compatibilità
        int hashedId = Math.abs(username.hashCode()) % 1000 + 1;
        System.out.println("⚠️ DEPRECATED: getId() chiamato - ID generato: " + hashedId + " per username: " + username);
        System.out.println("⚠️ RACCOMANDAZIONE: Modifica il codice per usare getUsername() e cercare nel database");
        
        return hashedId;
    }

    
    public static String getEmail() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication instanceof JwtAuthenticationToken jwtAuthToken) {
                Jwt jwt = (Jwt) jwtAuthToken.getCredentials();
                
                String email = jwt.getClaimAsString("email");
                if (email != null && !email.isEmpty()) {
                    System.out.println(" Email trovata: " + email);
                    return email;
                }
                
                System.err.println(" Email non trovata nel JWT");
                throw new IllegalStateException("Email non trovata nel token");
            }
            
            throw new IllegalStateException("Tipo di autenticazione non valido");
            
        } catch (Exception e) {
            System.err.println("❌ Error in getEmail(): " + e.getMessage());
            throw new IllegalStateException("Email non trovata");
        }
    }

   
    public static String getSubject() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication instanceof JwtAuthenticationToken jwtAuthToken) {
                Jwt jwt = (Jwt) jwtAuthToken.getCredentials();
                
                String subject = jwt.getSubject();
                if (subject != null && !subject.isEmpty()) {
                    System.out.println(" Subject trovato: " + subject);
                    return subject;
                }
                
                System.err.println("Subject non trovato nel JWT");
                throw new IllegalStateException("Subject non trovato nel token");
            }
            
            throw new IllegalStateException("Tipo di autenticazione non valido");
            
        } catch (Exception e) {
            System.err.println("Error in getSubject(): " + e.getMessage());
            throw new IllegalStateException("Subject non trovato");
        }
    }
}