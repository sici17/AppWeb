
package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import entities.*;

import java.util.List;

@Repository
public interface TesseraLibreriaRepository extends JpaRepository<TesseraLibreria, Integer> {
    
    @Query("SELECT COALESCE(SUM(t.creditiRimanenti), 0) FROM TesseraLibreria t WHERE t.utente = ?1 AND t.stato = 'ATTIVA'")
    int contaCreditiRimanentiUtente(Utente utente);

    List<TesseraLibreria> findByUtente(Utente utente);

    @Query("SELECT t FROM TesseraLibreria t WHERE t.utente = ?1 AND t.creditiRimanenti > 0 AND t.stato = 'ATTIVA'")
    List<TesseraLibreria> findByUtenteAndCrediti(Utente utente);

    
    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'RICHIESTA_PENDING' ORDER BY t.dataRichiesta ASC")
    List<TesseraLibreria> findRichiesteInAttesa();
   
    @Query("SELECT t FROM TesseraLibreria t WHERE t.stato = 'ATTIVA'")
    List<TesseraLibreria> findTessereAttive();

  

    
    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'RICHIESTA_PENDING'")
    long countRichiesteInAttesa();

    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'ATTIVA'")
    long countTessereAttive();

    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'SOSPESA'")
    long countTessereSospese();

    @Query("SELECT COUNT(t) FROM TesseraLibreria t WHERE t.stato = 'REVOCATA'")
    long countTessereRevocate();

   
 
}