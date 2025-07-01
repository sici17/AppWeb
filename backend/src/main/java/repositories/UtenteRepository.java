// backend/src/main/java/repositories/UtenteRepository.java - VERSIONE AGGIORNATA
package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import entities.*;

import java.util.Optional;

@Repository
public interface UtenteRepository extends JpaRepository<Utente, Integer> {
    
    Optional<Utente> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    Optional<Utente> findByMatricola(String matricola);
    
    boolean existsByMatricola(String matricola);
}