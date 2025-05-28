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

    // Query corrette - usando stati esistenti e campi esistenti
    static List<TesseraLibreria> findByStato(TesseraLibreria.StatoTessera stato) {
        // TODO Auto-generated method stub
        return null;
    }

    // Tessere attive ordinate per data emissione
    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'ATTIVA' ORDER BY t.dataEmissione DESC")
    List<TesseraLibreria> findTessereAttiveOrderByData();

    // Tessere sospese ordinate per data emissione
    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'SOSPESA' ORDER BY t.dataEmissione DESC")
    List<TesseraLibreria> findTessereSospeseOrderByData();

    // Tessere revocate ordinate per data emissione  
    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'REVOCATA' ORDER BY t.dataEmissione DESC")
    List<TesseraLibreria> findTessereRevocateOrderByData();
    
    
 // In repositories/TesseraLibreriaRepository.java

 // Aggiungi query per richieste pending
 @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'RICHIESTA_PENDING' ORDER BY t.dataRichiesta ASC")
 List<TesseraLibreria> findRichiesteInAttesa();

 @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'RICHIESTA_PENDING'")
 long countRichiesteInAttesa();


    // Statistiche per admin
    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'ATTIVA'")
    long countTessereAttive();

    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'SOSPESA'")
    long countTessereSospese();

    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'REVOCATA'")
    long countTessereRevocate();
}