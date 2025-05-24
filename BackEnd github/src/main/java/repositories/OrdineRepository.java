package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import entities.*;

import java.util.Date;
import java.util.List;

@Repository
public interface OrdineRepository extends JpaRepository<Ordine, Integer> {

    List<Ordine> findByDataCreazioneBetween(Date startDate, Date endDate);

    List<Ordine> findAll();

    List<Ordine> findByUtente(Utente utente);
}
