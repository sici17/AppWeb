package repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import entities.*;

import java.util.List;

@Repository
public interface ArticoloRepository extends JpaRepository<Articolo, Integer> {

    List<Articolo> findAll();

    @Query("SELECT a from Articolo a where a.nome LIKE ?1")
    List<Articolo> findByNome(String nome);

    @Query("SELECT a from Articolo a where a.prezzo>=?1 and a.prezzo<=?2")
    List<Articolo> findByPrezzoBetween(double prezzoMin, double prezzoMax);

    @Query("SELECT a from Articolo a where a.categoria LIKE ?1")
    List<Articolo> findByCategoria(String categoria);

    List<Articolo> findByCategoria(Articolo.CategoriaArticolo categoria);

    @Query("SELECT a FROM Articolo a WHERE " +
            "(a.nome LIKE %:nome% OR :nome IS NULL) AND " +
            "(a.prezzo = COALESCE(:prezzo, a.prezzo)) AND " +
            "(a.categoria = COALESCE(:categoria, a.categoria))")
    List<Articolo> findByNomeAndPrezzoAndCategoria(String nome, double prezzo, Articolo.CategoriaArticolo categoria);
}
