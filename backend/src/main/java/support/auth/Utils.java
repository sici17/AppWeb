package support.auth;

import lombok.experimental.UtilityClass;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@UtilityClass
@Log4j2
public class Utils {

    public static int getId() {
        try {
            // Controlla se c'è un'autenticazione attiva
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null) {
                System.err.println("❌ Nessuna autenticazione nel SecurityContext");
                throw new IllegalStateException("Utente non autenticato - effettuare login");
            }
            
            System.out.println("📋 Tipo autenticazione: " + authentication.getClass().getSimpleName());
            System.out.println("📋 Principal: " + authentication.getPrincipal());
            System.out.println("📋 Authorities: " + authentication.getAuthorities());
            
            // Verifica se è un'autenticazione anonima
            if (authentication.getPrincipal().equals("anonymousUser")) {
                System.err.println("❌ Utente anonimo - richiede login");
                throw new IllegalStateException("Utente non autenticato - effettuare login");
            }

            // Se è un JwtAuthenticationToken, estrai l'ID dal JWT
            if (authentication instanceof JwtAuthenticationToken jwtAuthToken) {
                Jwt jwt = (Jwt) jwtAuthToken.getCredentials();
                
                // Debug: mostra tutti i claims disponibili
                System.out.println("=== JWT CLAIMS DEBUG ===");
                jwt.getClaims().forEach((key, value) -> 
                    System.out.println(key + " = " + value + " (type: " + (value != null ? value.getClass().getSimpleName() : "null") + ")")
                );
                System.out.println("=========================");
                
                // Prova prima userId
                Object userIdClaim = jwt.getClaims().get("userId");
                System.out.println("userId claim: " + userIdClaim);
                
                if (userIdClaim != null) {
                    if (userIdClaim instanceof Long) {
                        return ((Long) userIdClaim).intValue();
                    }
                    if (userIdClaim instanceof Integer) {
                        return (Integer) userIdClaim;
                    }
                    if (userIdClaim instanceof String) {
                        return Integer.parseInt((String) userIdClaim);
                    }
                }
                
                // Fallback: usa subject (sub)
                String sub = jwt.getSubject();
                System.out.println("Subject (sub): " + sub);
                
                if (sub != null && !sub.isEmpty()) {
                    // Se sub è numerico, usalo
                    if (sub.matches("\\d+")) {
                        System.out.println("Using numeric subject as ID: " + sub);
                        return Integer.parseInt(sub);
                    }
                    // Altrimenti genera un ID più prevedibile e consistente
                    int hashedId = Math.abs(sub.hashCode()) % 1000 + 1; // ID tra 1 e 1000
                    System.out.println("Generated consistent ID from subject hash: " + hashedId + " (from subject: " + sub + ")");
                    return hashedId;
                }
                
                System.err.println("❌ Nessun ID valido trovato nel JWT");
                throw new IllegalStateException("ID utente non trovato nel token");
            }
            
            System.err.println("❌ Tipo di autenticazione non supportato: " + authentication.getClass());
            throw new IllegalStateException("Tipo di autenticazione non valido");
            
        } catch (Exception e) {
            System.err.println("❌ Error in getId(): " + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException("Utente non autenticato - effettuare login");
        }
    }
}