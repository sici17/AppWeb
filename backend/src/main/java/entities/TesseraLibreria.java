package entities;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Calendar;
import java.util.Date;

@Entity
@Getter
@Setter
@EqualsAndHashCode
@ToString
@Table(name = "tessera_libreria")
public class TesseraLibreria {
    @Id
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Basic
    @Column(name = "numero_tessera", unique = true, length = 20)
    private String numeroTessera;

    @ManyToOne
    @JoinColumn(name = "utente_id")
    private Utente utente;

    @ManyToOne
    @JoinColumn(name = "tipologia_id")
    private TipologiaTessera tipologia;

    @Temporal(TemporalType.DATE)
    @Column(name = "data_emissione")
    private Date dataEmissione = new Date();

    @Temporal(TemporalType.DATE)
    @Column(name = "data_scadenza")
    private Date dataScadenza;

    @Basic
    @Column(name = "crediti_rimanenti")
    private int creditiRimanenti=0;

    @Basic
    @Column(name = "crediti_totali_usati")
    private int creditiTotaliUsati = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "stato", nullable = false, length = 20)
    private StatoTessera stato = StatoTessera.ATTIVA;

    @Basic
    @Column(name = "rinnovo_automatico")
    private boolean rinnovoAutomatico = false;

    @Version
    private int version;

    @PrePersist
    private void prePersist() {
        // Genera numero tessera se non impostato
        if (numeroTessera == null) {
            numeroTessera = generaNumeroTessera();
        }
        
        // Calcola data scadenza (1 anno dalla emissione)
        if (dataScadenza == null && dataEmissione != null) {
            Calendar cal = Calendar.getInstance();
            cal.setTime(dataEmissione);
            cal.add(Calendar.YEAR, 1);
            dataScadenza = cal.getTime();
        }
        
        // Imposta crediti iniziali dalla tipologia
        if (tipologia != null && creditiRimanenti == 0) {
            creditiRimanenti = tipologia.getCreditiMensili();
        }
    }

    private String generaNumeroTessera() {
        // Genera numero tessera formato: LIB + anno + numero progressivo
        int anno = Calendar.getInstance().get(Calendar.YEAR);
        int random = (int) (Math.random() * 9999);
        return String.format("LIB%d%04d", anno, random);
    }
    @Getter
    @ToString
    public enum StatoTessera {
        ATTIVA("Attiva"),
        SCADUTA("Scaduta"),
        SOSPESA("Sospesa"),          // <-- DEVE ESSERE PRESENTE
        REVOCATA("Revocata"),
        BLOCCATA("Bloccata");

        private final String descrizione;

        StatoTessera(String descrizione) {
            this.descrizione = descrizione;
        }
    }
}