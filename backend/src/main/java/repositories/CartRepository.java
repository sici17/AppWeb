package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import entities.*;

@Repository
public interface CartRepository extends JpaRepository<Cart, Integer> {

    Cart findByUtente(Utente u);
}
