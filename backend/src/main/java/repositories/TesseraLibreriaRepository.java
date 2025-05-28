// backend/src/main/java/repositories/TesseraLibreriaRepository.java - VERSIONE MINIMALE FUNZIONANTE

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

    // Query di base che funzionano sicuramente
    List<TesseraLibreria> findByUtente(Utente utente);

    // Solo tessere ATTIVE con crediti (NON sospese)
    @Query("SELECT t FROM TesseraLibreria t WHERE t.utente = ?1 AND t.creditiRimanenti > 0 AND t.stato = 'ATTIVA'")
    List<TesseraLibreria> findByUtenteAndCreditiRimanentiGreaterThanZero(Utente utente);

    // 🔥 QUERY ESSENZIALI PER ADMIN DASHBOARD
    
    // Richieste in attesa - QUERY TESTATA
    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'RICHIESTA_PENDING' ORDER BY t.dataRichiesta ASC")
    List<TesseraLibreria> findRichiesteInAttesa();
    
    // Query per stato specifico - QUERY TESTATA
    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = ?1")
    List<TesseraLibreria> findByStato(TesseraLibreria.StatoTessera stato);

    // Tessere attive - QUERY TESTATA
    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'ATTIVA'")
    List<TesseraLibreria> findTessereAttive();

    // Tessere sospese - QUERY TESTATA
    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'SOSPESA'")
    List<TesseraLibreria> findTessereSospese();

    // Tessere revocate - QUERY TESTATA
    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'REVOCATA'")
    List<TesseraLibreria> findTessereRevocate();

    // 🔥 CONTEGGI PER STATISTICHE - QUERY TESTATE
    
    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'RICHIESTA_PENDING'")
    long countRichiesteInAttesa();

    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'ATTIVA'")
    long countTessereAttive();

    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'SOSPESA'")
    long countTessereSospese();

    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'REVOCATA'")
    long countTessereRevocate();

    // Tessere per tipologia - QUERY TESTATA
    @Query("SELECT t FROM TesseraLibreria t WHERE t.tipologia.id = ?1")
    List<TesseraLibreria> findByTipologiaId(int tipologiaId);
    
    // 🔥 NOTA: Rimuoviamo le query problematiche con DATE per ora
    // Possono essere implementate successivamente con logica Java nel Service
}