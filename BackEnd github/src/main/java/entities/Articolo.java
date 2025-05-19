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
@ToString(exclude = "articoliCarrello")
@Table(name = "articolo", schema = "dbprova")
public class Articolo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Basic
    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Basic
    @Column(name = "descrizione", columnDefinition = "TEXT")
    private String descrizione;

    @Basic
    @Column(name = "prezzo", nullable = false)
    private double prezzo;

    @Basic
    @Column(name = "codice_articolo", unique = true, length = 20)
    private String codiceArticolo;

    @Basic
    @Column(name = "marca", length = 50)
    private String marca;

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", nullable = false, length = 30)
    private CategoriaArticolo categoria;

    @Basic
    @Column(name = "giacenza", nullable = false)
    private int giacenza;

    @Basic
    @Column(name = "giacenza_minima")
    private int giacenzaMinima = 0;

    @Basic
    @Column(name = "immagine")
    private String immagine;

    @Basic
    @Column(name = "attivo")
    private boolean attivo = true;

    @Basic
    @Column(name = "sconto_percentuale")
    private double scontoPercentuale = 0.0;

    @OneToMany(mappedBy = "articolo", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ArticoloCarrello> articoliCarrello;

    @Getter
    @ToString
    public enum CategoriaArticolo {
        CANCELLERIA("Cancelleria"),
        GADGET("Gadget universitari"),
        LIBRO_VENDITA("Libri in vendita"),
        ACCESSORIO_INFORMATICO("Accessori informatici"),
        RIVISTA("Riviste"),
        MATERIALE_DIDATTICO("Materiale didattico"),
        CONSUMABILI("Materiale consumabile");

        private final String descrizione;

        CategoriaArticolo(String descrizione) {
            this.descrizione = descrizione;
        }
    }

    // Metodi di utilità
    public double getPrezzoScontato() {
        if (scontoPercentuale > 0) {
            return prezzo - (prezzo * scontoPercentuale / 100);
        }
        return prezzo;
    }

    public boolean isDisponibile() {
        return attivo && giacenza > 0;
    }

    public boolean isInEsaurimento() {
        return giacenza <= giacenzaMinima;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Articolo articolo = (Articolo) o;

        if (Double.compare(articolo.prezzo, prezzo) != 0) return false;
        if (giacenza != articolo.giacenza) return false;
        if (nome != null ? !nome.equals(articolo.nome) : articolo.nome != null) return false;
        if (descrizione != null ? !descrizione.equals(articolo.descrizione) : articolo.descrizione != null) return false;
        if (codiceArticolo != null ? !codiceArticolo.equals(articolo.codiceArticolo) : articolo.codiceArticolo != null) return false;
        if (marca != null ? !marca.equals(articolo.marca) : articolo.marca != null) return false;
        if (immagine != null ? !immagine.equals(articolo.immagine) : articolo.immagine != null) return false;
        return categoria == articolo.categoria;
    }

    @Override
    public int hashCode() {
        int result;
        result = nome != null ? nome.hashCode() : 0;
        result = 31 * result + (prezzo != +0.0d ? (int)(prezzo) : 0);
        result = 31 * result + (categoria != null ? categoria.hashCode() : 0);
        result = 31 * result + (descrizione != null ? descrizione.hashCode() : 0);
        result = 31 * result + (codiceArticolo != null ? codiceArticolo.hashCode() : 0);
        result = 31 * result + (marca != null ? marca.hashCode() : 0);
        result = 31 * result + (immagine != null ? immagine.hashCode() : 0);
        result = 31 * result + giacenza;
        return result;
    }
}