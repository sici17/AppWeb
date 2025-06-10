package repositories;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import entities.*;

import java.util.Date;
import java.util.List;

@Repository
public interface PrestitoRepository extends JpaRepository<Prestito, Integer> {
    
    List<Prestito> findByUtenteAndDataInizioAfter(Utente utente, Date data);
    
    List<Prestito> findByUtente(Utente utente);
    
    boolean existsPrestitoByUtenteAndRisorsaAndStato(Utente utente, Risorsa risorsa, Prestito.StatoPrestito stato);
}