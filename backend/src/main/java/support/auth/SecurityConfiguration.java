package support.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfiguration {

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        return new JwtAuthenticationConverter();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        // URL del JWKS endpoint di Keycloak
        String jwkSetUri = "http://localhost:8080/realms/biblioteca/protocol/openid-connect/certs";
        System.out.println("🔑 Configurazione JWT Decoder con JWKS URI: " + jwkSetUri);
        
        return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        System.out.println("🔐 === CONFIGURAZIONE SPRING SECURITY ===");
        
        http.csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> {
                System.out.println("📋 Configurazione autorizzazioni endpoint...");
                
                auth
                    // Endpoint completamente pubblici (senza token)
                    .requestMatchers(HttpMethod.GET, "/api/risorse/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/tessere/tipologie/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/users/registrazione").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/utenti/all").permitAll()
                    
                    // Endpoint di test per debug
                    .requestMatchers("/api/test/**").permitAll()
                    
                    // Tutti gli altri endpoint richiedono autenticazione JWT
                    .anyRequest().authenticated();
                
                System.out.println("✅ Autorizzazioni configurate");
            })
            .oauth2ResourceServer(oauth2 -> {
                System.out.println("🔧 Configurazione OAuth2 Resource Server...");
                oauth2.jwt(jwt -> {
                    jwt.decoder(jwtDecoder());
                    jwt.jwtAuthenticationConverter(jwtAuthenticationConverter());
                    System.out.println("✅ JWT configurato con custom converter");
                });
                System.out.println("✅ OAuth2 Resource Server configurato");
            })
            .sessionManagement(session -> {
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
                System.out.println("✅ Sessioni configurate come STATELESS");
            });

        System.out.println("🔐 === CONFIGURAZIONE SPRING SECURITY COMPLETATA ===");
        return http.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        System.out.println("🌐 Configurazione CORS...");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration configuration = new CorsConfiguration();
        
        configuration.setAllowCredentials(true);
        configuration.addAllowedOrigin("http://localhost:3000");
        configuration.addAllowedOrigin("http://localhost:4200");
        configuration.addAllowedOrigin("http://localhost:8080");
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        
        source.registerCorsConfiguration("/**", configuration);
        System.out.println("✅ CORS configurato");
        
        return source;
    }

    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }
}