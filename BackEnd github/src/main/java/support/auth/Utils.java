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
        JwtAuthenticationToken authenticationToken = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) authenticationToken.getCredentials();
        return ((Long) jwt.getClaims().get("userId")).intValue();
    }
}
