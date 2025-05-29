package entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Entity
@Getter
@Setter
@ToString(exclude = "ordine")
@EqualsAndHashCode(exclude = "ordine")
@Table(name = "articolo_ordine", schema = "dbprova")
public class ArticoloOrdine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @ManyToOne
    @JoinColumn(name = "articolo_carrello_id")
    private ArticoloCarrello articoloCarrello;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "ordine_id")
    private Ordine ordine;

    @Basic
    @Column(name = "quantita_ordinata")
    private int quantitaOrdinata=0;

    @Basic
    @Column(name = "prezzo_unitario_ordine")
    private double prezzoUnitarioOrdine=0.0;

    @Basic
    @Column(name = "sconto_riga")
    private double scontoRiga = 0.0;

    @Basic
    @Column(name = "note_riga", columnDefinition = "TEXT")
    private String noteRiga;

    @PrePersist
    private void prePersist() {
        if (articoloCarrello != null) {
            this.quantitaOrdinata = articoloCarrello.getQuantita();
            this.prezzoUnitarioOrdine = articoloCarrello.getPrezzoUnitario();
        }
    }

    // Metodi di utilità
    public double getTotaleRiga() {
        return (quantitaOrdinata * prezzoUnitarioOrdine) - scontoRiga;
    }

    public String getNomeArticolo() {
        return articoloCarrello != null && articoloCarrello.getArticolo() != null
                ? articoloCarrello.getArticolo().getNome()
                : "";
    }

    public String getCategoriaArticolo() {
        return articoloCarrello != null && articoloCarrello.getArticolo() != null
                ? articoloCarrello.getArticolo().getCategoria().getDescrizione()
                : "";
    }
}