package entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Entity
@Getter
@Setter
@ToString(exclude = "cart")
@Table(name = "articolo_carrello", schema = "dbprova")
public class ArticoloCarrello {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "quantita")
    private int quantita;

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "carrello_id")
    private Cart cart;

    @ManyToOne
    @JoinColumn(name = "articolo_id")
    private Articolo articolo;

    @Basic
    @Column(name = "in_carrello")
    @JsonIgnore
    private boolean inCarrello;

    @Basic
    @Column(name = "prezzo_unitario")
    private double prezzoUnitario; // Prezzo al momento dell'aggiunta al carrello

    @OneToMany
    @JsonIgnore
    @JoinColumn(name = "articoloOrdine")
    private List<ArticoloOrdine> articoloOrdine;

    @PrePersist
    @PreUpdate
    private void updatePrezzoUnitario() {
        if (articolo != null) {
            this.prezzoUnitario = articolo.getPrezzoScontato();
        }
    }

    // Metodi di utilità
    public double getTotaleRiga() {
        return quantita * prezzoUnitario;
    }

    public boolean isDisponibile() {
        return articolo != null && articolo.isDisponibile() && 
               articolo.getGiacenza() >= quantita;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        ArticoloCarrello that = (ArticoloCarrello) o;

        if (quantita != that.quantita) return false;
        if (!articolo.equals(that.articolo)) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = articolo.hashCode();
        result = 31 * result + quantita;
        return result;
    }
}
