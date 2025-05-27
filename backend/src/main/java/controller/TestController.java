package controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
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
}