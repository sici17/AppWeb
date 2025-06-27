package support.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.stereotype.Component;

import io.micrometer.common.lang.NonNull;

import java.util.*;
import java.util.stream.*;

@Component
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    private final JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

    @Value("${jwt.auth.converter.principle-attribute}")
    private String principleAttribute;
    @Value("${jwt.auth.converter.resource-id}")
    private String resourceId;

    @Override
    public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
        Collection<GrantedAuthority> authorities = Stream.concat(
                jwtGrantedAuthoritiesConverter.convert(jwt).stream(),
                extractResourceRoles(jwt).stream()
        ).collect(Collectors.toSet());

        return new JwtAuthenticationToken(jwt, authorities, getPrincipleClaimName(jwt));
    }

    private String getPrincipleClaimName(Jwt jwt) {
        String claimName = principleAttribute != null ? principleAttribute : JwtClaimNames.SUB;
        return jwt.getClaim(claimName);
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractResourceRoles(Jwt jwt) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        
        // estrai ruoli del realm
        extractRolesFromClaim(jwt, "realm_access", authorities);
        
        // estrai ruoli del client
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null && resourceAccess.get(resourceId) != null) {
            Map<String, Object> clientRoles = (Map<String, Object>) resourceAccess.get(resourceId);
            addRolesToAuthorities(clientRoles, authorities);
        }
        
        return authorities;
    }
    
    private void extractRolesFromClaim(Jwt jwt, String claimName, Set<GrantedAuthority> authorities) {
        Map<String, Object> claim = jwt.getClaim(claimName);
        if (claim != null) {
            addRolesToAuthorities(claim, authorities);
        }
    }
    
    @SuppressWarnings("unchecked")
    private void addRolesToAuthorities(Map<String, Object> rolesMap, Set<GrantedAuthority> authorities) {
        if (rolesMap.get("roles") instanceof Collection) {
            Collection<String> roles = (Collection<String>) rolesMap.get("roles");
            roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .forEach(authorities::add);
        }
    }
}