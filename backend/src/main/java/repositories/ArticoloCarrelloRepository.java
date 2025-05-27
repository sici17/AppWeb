package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import entities.*;

import java.util.List;

@Repository
public interface ArticoloCarrelloRepository extends JpaRepository<ArticoloCarrello, Integer> {

    List<ArticoloCarrello> findByCartAndInCarrello(Cart cart, boolean inCarrello);
}
