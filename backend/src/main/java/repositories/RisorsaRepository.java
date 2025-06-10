package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import entities.*;

import java.util.List;
import java.util.Optional;

@Repository
public interface RisorsaRepository extends JpaRepository<Risorsa, Integer> {
    
    // Metodi derivati semplici come nel progetto originale
    Optional<Risorsa> findByTitolo(String titolo);
    
    List<Risorsa> findByTitoloContainingIgnoreCase(String titolo);
    
    List<Risorsa> findByTipo(Risorsa.TipoRisorsa tipo);
}
