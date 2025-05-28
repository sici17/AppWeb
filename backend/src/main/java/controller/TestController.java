package controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import support.auth.Utils;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> testPublic() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Endpoint pubblico funzionante");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/auth-debug")
    public ResponseEntity<Map<String, Object>> debugAuth(HttpServletRequest request) {
        System.out.println("🔍 === DEBUG AUTENTICAZIONE ===");
        
        Map<String, Object> response = new HashMap<>();
        
        // Headers
        String authHeader = request.getHeader("Authorization");
        System.out.println("📤 Authorization Header: " + (authHeader != null ? 
            authHeader.substring(0, Math.min(50, authHeader.length())) + "..." : "NULL"));
        response.put("authHeader", authHeader != null ? "Present (Bearer token)" : "Missing");
        
        // Security Context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("🔐 Authentication Type: " + (auth != null ? auth.getClass().getSimpleName() : "NULL"));
        System.out.println("🔐 Principal: " + (auth != null ? auth.getPrincipal() : "NULL"));
        System.out.println("🔐 Authorities: " + (auth != null ? auth.getAuthorities() : "NULL"));
        
        response.put("authenticationType", auth != null ? auth.getClass().getSimpleName() : "None");
        response.put("principal", auth != null ? auth.getPrincipal().toString() : "None");
        response.put("isAuthenticated", auth != null && auth.isAuthenticated());
        response.put("isAnonymous", auth != null && auth.getPrincipal().equals("anonymousUser"));
        
        // JWT specifico
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            System.out.println("✅ JWT Authentication trovato!");
            Jwt jwt = (Jwt) jwtAuth.getCredentials();
            
            System.out.println("📋 JWT Claims:");
            jwt.getClaims().forEach((key, value) -> 
                System.out.println("  " + key + " = " + value)
            );
            
            response.put("jwtSubject", jwt.getSubject());
            response.put("jwtIssuer", jwt.getIssuer().toString());
            response.put("jwtExpiration", jwt.getExpiresAt().toString());
            response.put("jwtClaims", jwt.getClaims());
        } else {
            System.out.println("❌ JWT Authentication NON trovato");
            response.put("jwtStatus", "JWT Authentication not found");
        }
        
        System.out.println("🔍 === FINE DEBUG ===");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/protected")
    public ResponseEntity<Map<String, Object>> testProtected() {
        Map<String, Object> response = new HashMap<>();
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = (Jwt) jwtAuth.getCredentials();
            
            response.put("message", "Endpoint protetto accessibile!");
            response.put("user", jwt.getSubject());
            response.put("roles", jwt.getClaimAsStringList("realm_access"));
            response.put("timestamp", System.currentTimeMillis());
        } else {
            response.put("error", "JWT non trovato");
            response.put("authType", auth != null ? auth.getClass().getSimpleName() : "None");
        }
        
        return ResponseEntity.ok(response);
    }
    
    
    
 // Aggiungi questo endpoint nel TestController per debug avanzato

    @GetMapping("/jwt-debug")
    public ResponseEntity<Map<String, Object>> debugJwtDetailed(HttpServletRequest request) {
        System.out.println("🔍 === DEBUG JWT DETTAGLIATO ===");
        
        Map<String, Object> response = new HashMap<>();
        
        // 1. Headers HTTP
        String authHeader = request.getHeader("Authorization");
        System.out.println("📤 Authorization Header: " + authHeader);
        
        if (authHeader == null) {
            response.put("error", "Authorization header mancante");
            return ResponseEntity.status(401).body(response);
        }
        
        if (!authHeader.startsWith("Bearer ")) {
            response.put("error", "Authorization header non inizia con Bearer");
            return ResponseEntity.status(401).body(response);
        }
        
        String token = authHeader.substring(7);
        System.out.println("🎫 Token JWT (primi 100 char): " + token.substring(0, Math.min(100, token.length())));
        
        // 2. Security Context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("🔐 Authentication Type: " + (auth != null ? auth.getClass().getSimpleName() : "NULL"));
        
        if (auth == null) {
            response.put("error", "Authentication null nel SecurityContext");
            return ResponseEntity.status(401).body(response);
        }
        
        System.out.println("🔐 Principal: " + auth.getPrincipal());
        System.out.println("🔐 Authorities: " + auth.getAuthorities());
        System.out.println("🔐 Is Authenticated: " + auth.isAuthenticated());
        
        // 3. JWT specifico
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            System.out.println("✅ JWT Authentication riconosciuto!");
            Jwt jwt = (Jwt) jwtAuth.getCredentials();
            
            System.out.println("📋 JWT Claims:");
            jwt.getClaims().forEach((key, value) -> 
                System.out.println("  " + key + " = " + value)
            );
            
            response.put("success", true);
            response.put("jwtSubject", jwt.getSubject());
            response.put("jwtIssuer", jwt.getIssuer().toString());
            response.put("jwtExpiration", jwt.getExpiresAt().toString());
            response.put("jwtClaims", jwt.getClaims());
            response.put("authorities", auth.getAuthorities());
            
            // 4. Test Utils.getId()
            try {
                int userId = Utils.getId();
                System.out.println("🆔 Utils.getId() = " + userId);
                response.put("utilsGetId", userId);
            } catch (Exception e) {
                System.err.println("❌ Errore Utils.getId(): " + e.getMessage());
                response.put("utilsGetIdError", e.getMessage());
            }
            
        } else {
            System.err.println("❌ JWT Authentication NON riconosciuto");
            response.put("error", "JWT Authentication non trovato");
            response.put("actualAuthType", auth.getClass().getSimpleName());
            
            return ResponseEntity.status(401).body(response);
        }
        
        System.out.println("🔍 === FINE DEBUG JWT ===");
        return ResponseEntity.ok(response);
    }
    
    
    
    @GetMapping("/jwt-validation")
    public ResponseEntity<Map<String, Object>> testJwtValidation(HttpServletRequest request) {
        System.out.println("🧪 === TEST JWT VALIDATION ===");
        
        Map<String, Object> response = new HashMap<>();
        
        // 1. Verifica header Authorization
        String authHeader = request.getHeader("Authorization");
        System.out.println("📤 Authorization Header: " + (authHeader != null ? "Present" : "Missing"));
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.put("error", "Authorization header mancante o malformato");
            return ResponseEntity.status(401).body(response);
        }
        
        // 2. Verifica SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("🔐 Authentication type: " + (auth != null ? auth.getClass().getSimpleName() : "NULL"));
        System.out.println("🔐 Is authenticated: " + (auth != null && auth.isAuthenticated()));
        System.out.println("🔐 Principal: " + (auth != null ? auth.getPrincipal() : "NULL"));
        System.out.println("🔐 Authorities: " + (auth != null ? auth.getAuthorities() : "NULL"));
        
        if (auth == null || !auth.isAuthenticated()) {
            response.put("error", "Utente non autenticato nel SecurityContext");
            return ResponseEntity.status(401).body(response);
        }
        
        // 3. Test specifico JwtAuthenticationToken
        if (!(auth instanceof JwtAuthenticationToken)) {
            response.put("error", "Authentication non è di tipo JwtAuthenticationToken");
            response.put("actualType", auth.getClass().getSimpleName());
            return ResponseEntity.status(401).body(response);
        }
        
        JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) auth;
        Jwt jwt = (Jwt) jwtAuth.getCredentials();
        
        // 4. Test Utils.getId()
        try {
            int userId = Utils.getId();
            System.out.println("🆔 Utils.getId() = " + userId);
            
            response.put("success", true);
            response.put("userId", userId);
            response.put("subject", jwt.getSubject());
            response.put("username", jwt.getClaimAsString("preferred_username"));
            response.put("authorities", auth.getAuthorities());
            response.put("claims", jwt.getClaims());
            
        } catch (Exception e) {
            System.err.println("❌ Errore Utils.getId(): " + e.getMessage());
            response.put("error", "Errore nell'estrazione ID utente");
            response.put("errorMessage", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
        
        System.out.println("✅ JWT validation completata con successo");
        return ResponseEntity.ok(response);
    }
    
    
    
    
}