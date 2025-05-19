package entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@EqualsAndHashCode
@ToString
@Entity
@Table(name = "risorsa", schema="dbprova")
public class Risorsa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id", nullable = false)
    private int id;

    @Basic
    @Column(name = "titolo", nullable = false, length = 255)
    private String titolo;

    @Basic
    @Column(name = "autore", length = 255)
    private String autore;

    @Basic
    @Column(name = "isbn", length = 20)
    private String isbn;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    private TipoRisorsa tipo;

    @Basic
    @Column(name = "editore", length = 100)
    private String editore;

    @Basic
    @Column(name = "anno_pubblicazione")
    private Integer annoPubblicazione;

    @Basic
    @Column(name = "collocazione", length = 20)
    private String collocazione;

    @Basic
    @Column(name = "copie_disponibili", nullable = false)
    private int copieDisponibili;

    @Basic
    @Column(name = "copie_totali", nullable = false)
    private int copieTotali;

    @Enumerated(EnumType.STRING)
    @Column(name = "stato", nullable = false, length = 20)
    private StatoRisorsa stato = StatoRisorsa.DISPONIBILE;

    @Basic
    @Column(name = "descrizione", columnDefinition = "TEXT")
    private String descrizione;

    @Basic
    @Column(name = "immagine_copertina")
    private String immagineCopertina;

    @OneToMany(mappedBy="risorsa", cascade = CascadeType.MERGE)
    @JsonIgnore
    private List<Prestito> prestiti;

    @Getter
    @ToString
    public enum TipoRisorsa {
        LIBRO("Libro"),
        RIVISTA("Rivista"),
        TESI("Tesi"),
        POSTAZIONE_PC("Postazione PC"),
        DVD("DVD"),
        AUDIOLIBRO("Audiolibro"),
        EBOOK("E-book"),
        MANUALE("Manuale");

        private final String descrizione;

        TipoRisorsa(String descrizione) {
            this.descrizione = descrizione;
        }
    }

    @Getter
    @ToString
    public enum StatoRisorsa {
        DISPONIBILE("Disponibile"),
        PRESTITO("In prestito"),
        MANUTENZIONE("In manutenzione"),
        RITIRATO("Ritirato"),
        PRENOTATO("Prenotato");

        private final String descrizione;

        StatoRisorsa(String descrizione) {
            this.descrizione = descrizione;
        }
    }
}
