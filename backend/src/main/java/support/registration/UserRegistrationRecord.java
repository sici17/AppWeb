package support.registration;

import entities.Utente;

public record UserRegistrationRecord(String username, String email, Utente.Sesso sesso, String firstName, String lastName, String password, int id) {
}