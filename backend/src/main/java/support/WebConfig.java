package support;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*") // Permetti tutti gli origins
                .allowedOrigins(
                    "http://localhost:4200",
                    "http://127.0.0.1:4200",
                    "http://localhost:3000",
                    "http://localhost:8080"
                )
                .allowedMethods("*") // Permetti tutti i metodi
                .allowedHeaders("*") // Permetti tutti gli headers
                .allowCredentials(true)
                .maxAge(3600);
    }

   
}