package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import entities.*;

@Repository
public interface UtenteRepository extends JpaRepository<Utente, Integer> {
    // Solo metodi derivati semplici, come nel progetto originale
}