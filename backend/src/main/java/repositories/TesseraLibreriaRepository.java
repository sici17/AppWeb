package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import entities.*;

import java.util.List;

@Repository
public interface TesseraLibreriaRepository extends JpaRepository<TesseraLibreria, Integer> {
    
    // Query per contare i crediti - seguendo il pattern di AbbonamentoRepository
    @Query("SELECT COALESCE(SUM(t.creditiRimanenti),0) FROM Utente u,TesseraLibreria t WHERE u.id = t.utente.id AND u = ?1")
    int contaCreditiRimanentiUtente(Utente utente);

    List<TesseraLibreria> findByUtente(Utente utente);

    @Query("SELECT t FROM TesseraLibreria t WHERE t.utente = ?1 AND t.creditiRimanenti > 0")
    List<TesseraLibreria> findByUtenteAndCreditiRimanentiGreaterThanZero(Utente utente);
}