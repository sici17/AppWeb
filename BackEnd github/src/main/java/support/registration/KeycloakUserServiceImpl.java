package support.registration;


import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import repositories.CartRepository;
import repositories.UtenteRepository;
import support.exceptions.ErroreRegistrazione;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.ClientResource;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import entities.Cart;
import entities.Utente;

import java.util.*;

@Service
@Slf4j
public class KeycloakUserServiceImpl implements KeycloakUserService {

    @Autowired
    private UtenteRepository utenteRepository;

    @Value("biblioteca")
    private String realm;

    @Value("http://localhost:8081/")
    private String serverUrl;

    @Value("admin-cli")
    private String clientId;
    @Value("UubJ2PW7y2i2F7qHJ0wD3sKaVfUl0W5y")
    private String secret;
    private String usernameAdmin = "admin";
    private String passwordAdmin = "password";

    @Autowired
    private CartRepository carrelloRepository;

    @Override
    @Transactional(rollbackOn = Exception.class)
    public ResponseEntity<Utente> createUser(UserRegistrationRecord userRegistrationRecord) throws ErroreRegistrazione {

        if (userRegistrationRecord == null) {
            throw new ErroreRegistrazione();
        }
        Utente u = new Utente();
        u.setOrdini(new HashSet<>());
        u.setNome(userRegistrationRecord.firstName());
        u.setCognome(userRegistrationRecord.lastName());
        u.setEmail(userRegistrationRecord.email());
        u.setTessere(new ArrayList<>());
        u.setPrestiti(new ArrayList<>());
        u.setSesso(userRegistrationRecord.sesso());
        u.setTipoUtente(Utente.TipoUtente.STUDENTE); // Default per nuovi utenti
        
        Cart c = new Cart();
        c.setUtente(u);
        Utente utente_salvato = utenteRepository.save(u);
        carrelloRepository.save(c);

        Keycloak keycloak = KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(realm)
                .grantType(OAuth2Constants.PASSWORD)
                .clientId(clientId)
                .clientSecret(secret)
                .username(usernameAdmin)
                .password(passwordAdmin)
                .build();

        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(userRegistrationRecord.username());
        user.setEmail(userRegistrationRecord.email());
        user.setFirstName(userRegistrationRecord.firstName());
        user.setLastName(userRegistrationRecord.lastName());
        user.setEmailVerified(true);

        CredentialRepresentation credentialRepresentation = new CredentialRepresentation();
        credentialRepresentation.setValue(userRegistrationRecord.password());
        credentialRepresentation.setTemporary(false);
        credentialRepresentation.setType(CredentialRepresentation.PASSWORD);

        List<CredentialRepresentation> list = new ArrayList<>();
        list.add(credentialRepresentation);

        user.setCredentials(list);

        Integer idToSave = utente_salvato.getId();
        Map<String, List<String>> attributes = new HashMap<>();
        attributes.put("userId", Collections.singletonList(idToSave.toString()));
        attributes.put("origin", Arrays.asList("biblioteca"));
        user.setAttributes(attributes);

        RealmResource realm1 = keycloak.realm(realm);
        UsersResource userResource = realm1.users();

        Response response = userResource.create(user);

        if (response.getStatus() == Response.Status.CREATED.getStatusCode()) {
            String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");

            ClientRepresentation clientRep = realm1.clients().findByClientId(clientId).get(0);
            ClientResource clientResource = realm1.clients().get(clientRep.getId());

            RoleRepresentation userRole = clientResource.roles().get("utente").toRepresentation();
            userResource.get(userId).roles().clientLevel(clientResource.toRepresentation().getId()).add(Collections.singletonList(userRole));

            return new ResponseEntity<Utente>(utente_salvato, HttpStatus.OK);
        } else {
            throw new ErroreRegistrazione();
        }
    }
}
