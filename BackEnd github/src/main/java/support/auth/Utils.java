package support.auth;


import lombok.experimental.UtilityClass;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@UtilityClass
@Log4j2
public class Utils {

//    public static String getEmail() {
//        JwtAuthenticationToken authenticationToken = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
//        Jwt jwt = (Jwt) authenticationToken.getCredentials();
//        return (String) jwt.getClaims().get("email");
//    }
//
//    public static String getName() {
//        JwtAuthenticationToken authenticationToken = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
//        Jwt jwt = (Jwt) authenticationToken.getCredentials();
//        return (String) jwt.getClaims().get("name");
//    }

    public static int getId() {
        try {
            JwtAuthenticationToken authenticationToken = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
            Jwt jwt = (Jwt) authenticationToken.getCredentials();
            
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
            
            // Ultima opzione: ID fittizio per testing
            System.err.println("WARNING: No valid user ID found, using default ID = 1");
            return 1;
            
        } catch (Exception e) {
            System.err.println("Error in getId(): " + e.getMessage());
            e.printStackTrace();
            return 1; // ID di fallback per test
        }
    }
 }

