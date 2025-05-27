package support.auth;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    private final JwtGrantedAuthoritiesConverter scopesConverter = new JwtGrantedAuthoritiesConverter();
    
    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        System.out.println("🔄 === JWT AUTHENTICATION CONVERTER ===");
        System.out.println("🔄 JWT Subject: " + jwt.getSubject());
        System.out.println("🔄 JWT Issuer: " + jwt.getIssuer());
        System.out.println("🔄 JWT Claims:");
        jwt.getClaims().forEach((key, value) -> 
            System.out.println("   " + key + " = " + value)
        );
        
        // Combina le autorità dai vari claim
        Collection<GrantedAuthority> authorities = Stream.concat(
                scopesConverter.convert(jwt).stream(),
                extractRealmRoles(jwt).stream()
        ).collect(Collectors.toSet());
        
        System.out.println("🔄 Authorities estratte: " + authorities);
        
        String principalName = jwt.getClaimAsString("preferred_username");
        System.out.println("🔄 Principal name: " + principalName);
        
        JwtAuthenticationToken token = new JwtAuthenticationToken(jwt, authorities, principalName);
        System.out.println("✅ JWT Authentication Token creato");
        
        return token;
    }
    
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        System.out.println("🔄 Estrazione realm roles...");
        
        if (jwt.getClaim("realm_access") == null) {
            System.out.println("⚠️ Nessun realm_access claim trovato");
            return Set.of();
        }
        
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        System.out.println("🔄 realm_access: " + realmAccess);
        
        @SuppressWarnings("unchecked")
        Collection<String> realmRoles = (Collection<String>) realmAccess.get("roles");
        System.out.println("🔄 Realm roles: " + realmRoles);
        
        Collection<GrantedAuthority> authorities = realmRoles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toSet());
        
        System.out.println("🔄 Authorities create dai realm roles: " + authorities);
        
        return authorities;
    }
}