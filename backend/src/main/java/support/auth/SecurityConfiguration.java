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
@EnableMethodSecurity(prePostEnabled = true) //  per @PreAuthorize
public class SecurityConfiguration {

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        return new JwtAuthenticationConverter();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        String jwkSetUri = "http://localhost:8080/realms/biblioteca/protocol/openid-connect/certs";
        
        try {
            NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
            System.out.println("JWT Decoder configurato correttamente");
            return jwtDecoder;
        } catch (Exception e) {
            System.err.println("Errore configurazione JWT Decoder: " + e.getMessage());
            throw new RuntimeException("impossibile configurare JWT Decoder", e);
        }
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> {
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
                System.out.println("STATELESS");
            })
            .authorizeHttpRequests(auth -> {
                System.out.println("configurazione autorizzazioni...");
                
                auth
                    // endpoint  pubblici 
                    .requestMatchers(HttpMethod.GET, "/api/risorse/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/tessere/tipologie/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/users/registrazione").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/utenti/all").permitAll()
                    .requestMatchers("/api/test/**").permitAll() // Per debug
                    
                    .anyRequest().authenticated();
                
                System.out.println("sutorizzazioni configurate");
            })
            .oauth2ResourceServer(oauth2 -> {
                
                oauth2.jwt(jwt -> {
                    jwt.decoder(jwtDecoder());
                    jwt.jwtAuthenticationConverter(jwtAuthenticationConverter());
                    System.out.println("JWT processor configurato");
                });
                
                System.out.println("OAuth2 Resource Server configurato");
            });

        System.out.println("security configurato");
        return http.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration configuration = new CorsConfiguration();
        
        configuration.setAllowCredentials(true);
        configuration.addAllowedOriginPattern("http://localhost:*"); // Permette qualsiasi porta su localhost
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.addExposedHeader("Authorization");
        
        source.registerCorsConfiguration("/**", configuration);
        System.out.println("cors configurato");
        
        return source;
    }

    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }
}