package entities;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@ToString(exclude = "utente")
@EqualsAndHashCode(exclude = "utente")
@Table(name = "cart", schema="dbprova")
public class Cart {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utente_id")
    private Utente utente;

    @Column(name = "articolo")
    @OneToMany(mappedBy = "cart", fetch = FetchType.EAGER, cascade = CascadeType.MERGE)
    private Set<ArticoloCarrello> articoli = new HashSet<>();

    @Version
    @Column(name="version", nullable = true)
    private int version;

    // Metodi di utilità
    public double getTotaleCarrello() {
        return articoli.stream()
                .filter(ArticoloCarrello::isInCarrello)
                .mapToDouble(ac -> ac.getQuantita() * ac.getArticolo().getPrezzoScontato())
                .sum();
    }

    public int getNumeroArticoli() {
        return articoli.stream()
                .filter(ArticoloCarrello::isInCarrello)
                .mapToInt(ArticoloCarrello::getQuantita)
                .sum();
    }

    public boolean isEmpty() {
        return articoli.stream().noneMatch(ArticoloCarrello::isInCarrello);
    }
}
