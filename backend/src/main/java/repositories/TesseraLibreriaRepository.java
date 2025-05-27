package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import entities.*;

import java.util.List;

@Repository
public interface TesseraLibreriaRepository extends JpaRepository<TesseraLibreria, Integer> {
    
    // Query per contare i crediti - solo tessere ATTIVE (NON sospese)
    @Query("SELECT COALESCE(SUM(t.creditiRimanenti),0) FROM Utente u,TesseraLibreria t WHERE u.id = t.utente.id AND u = ?1 AND t.stato = 'ATTIVA'")
    int contaCreditiRimanentiUtente(Utente utente);

    List<TesseraLibreria> findByUtente(Utente utente);

    // Solo tessere ATTIVE con crediti (NON sospese)
    @Query("SELECT t FROM TesseraLibreria t WHERE t.utente = ?1 AND t.creditiRimanenti > 0 AND t.stato = 'ATTIVA'")
    List<TesseraLibreria> findByUtenteAndCreditiRimanentiGreaterThanZero(Utente utente);

    // NUOVE QUERY PER APPROVAZIONE
    List<TesseraLibreria> findByStato(TesseraLibreria.StatoTessera stato);

    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'RICHIESTA' ORDER BY t.dataRichiesta ASC")
    List<TesseraLibreria> findRichiesteInAttesaOrderByData();

    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'ATTIVA' ORDER BY t.dataEmissione DESC")
    List<TesseraLibreria> findTessereAttiveOrderByData();

    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'RIFIUTATA' ORDER BY t.dataApprovazione DESC")
    List<TesseraLibreria> findTessereRifiutateOrderByData();

    // Statistiche per admin
    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'RICHIESTA'")
    long countRichiesteInAttesa();

    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'ATTIVA'")
    long countTessereAttive();

    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'RIFIUTATA'")
    long countTessereRifiutate();
}