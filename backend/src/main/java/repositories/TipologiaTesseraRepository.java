package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import entities.*;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipologiaTesseraRepository extends JpaRepository<TipologiaTessera, Integer> {
    
    // Seguendo il pattern di PacchettoRepository
    Optional<TipologiaTessera> findByCreditiMensili(int creditiMensili);

    boolean existsByCreditiMensili(int creditiMensili);

    Optional<List<TipologiaTessera>> findByCostoAnnualeBetween(double min, double max);

    @Query("SELECT t from TipologiaTessera t where t.costoAnnuale*12>=?1 and t.costoAnnuale*12<=?2")
    Optional<List<TipologiaTessera>> findByPrezzoBetween(double min, double max);
}