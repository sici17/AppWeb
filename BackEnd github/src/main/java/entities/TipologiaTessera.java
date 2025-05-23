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
@Table(name = "tipologia_tessera", schema="dbprova")
public class TipologiaTessera {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private int id;

    @Basic
    @Column(name = "nome", nullable = false, length = 50)
    private String nome; // "Studente", "Docente", "Esterno"

    @Basic
    @Column(name = "descrizione", columnDefinition = "TEXT")
    private String descrizione;

    @Basic
    @Column(name = "crediti_mensili", nullable = false)
    private int creditiMensili; // numero prestiti al mese

    @Basic
    @Column(name = "durata_prestito_giorni", nullable = false)
    private int durataPrestitoGiorni; // giorni di prestito standard

    @Basic
    @Column(name = "max_rinnovi")
    private int maxRinnovi = 1; // numero massimo di rinnovi per prestito

    @Basic
    @Column(name = "costo_annuale")
    private double costoAnnuale = 0.0;

    @Basic
    @Column(name = "multa_giornaliera")
    private double multaGiornaliera = 0.50; // multa per giorno di ritardo

    @Basic
    @Column(name = "max_prestiti_contemporanei")
    private double maxPrestitiContemporanei = 3;

    @Basic
    @Column(name = "rinnovo_automatico")
    private boolean rinnovoAutomatico = false;

    @Basic
    @Column(name = "attiva")
    private boolean attiva = true;

    @JsonIgnore
    @OneToMany(mappedBy = "tipologia")
    private List<TesseraLibreria> tessere;

    // Metodi di utilità
    public boolean isPagamento() {
        return  costoAnnuale > 0;
    }

    public boolean isRinnovoConsentito() {
        return  maxRinnovi > 0;
    }
}