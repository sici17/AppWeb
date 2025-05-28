package entities;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Date;

@Getter
@Setter
@EqualsAndHashCode
@ToString
@Entity
@Table(name = "prestito", schema="dbprova")
public class Prestito {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private int id;

    @ManyToOne
    @JoinColumn(name = "utente_id")
    private Utente utente;

    @ManyToOne
    @JoinColumn(name = "risorsa_id")
    private Risorsa risorsa;

    @Temporal(TemporalType.DATE)
    @Column(name = "data_inizio", nullable = false)
    private Date dataInizio;

    @Temporal(TemporalType.DATE)
    @Column(name = "data_scadenza", nullable = false)
    private Date dataScadenza;

    @Temporal(TemporalType.DATE)
    @Column(name = "data_restituzione")
    private Date dataRestituzione; // null se non ancora restituito

    @Enumerated(EnumType.STRING)
    @Column(name = "stato", nullable = false, length = 20)
    private StatoPrestito stato = StatoPrestito.ATTIVO;

    @Basic
    @Column(name = "multa")
    private double multa = 0.0;

    @Basic
    @Column(name = "rinnovato")
    private boolean rinnovato = false;

    @Basic
    @Column(name = "numero_rinnovi")
    private int numeroRinnovi = 0;

    @Basic
    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Version
    private int version;

    @PrePersist
    private void prePersist() {
        if (dataInizio == null) {
            dataInizio = new Date();
        }
        // Calcola data scadenza se non impostata (es: 14 giorni dopo)
        if (dataScadenza == null && dataInizio != null) {
            long millisecondi = dataInizio.getTime() + (14L * 24 * 60 * 60 * 1000);
            dataScadenza = new Date(millisecondi);
        }
    }

    @Getter
    @ToString
    public enum StatoPrestito {
        ATTIVO("Attivo"),
        RESTITUITO("Restituito"),
        SCADUTO("Scaduto"),
        RINNOVATO("Rinnovato"),
        SMARRITO("Smarrito"),
        DANNEGGIATO("Danneggiato");

        private final String descrizione;

        StatoPrestito(String descrizione) {
            this.descrizione = descrizione;
        }
    }
}