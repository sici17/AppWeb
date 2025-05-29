package entities;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@EqualsAndHashCode
@ToString
@Table(name = "ordine", schema = "dbprova")
public class Ordine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Basic
    @Column(name = "numero_ordine", unique = true, length = 20)
    private String numeroOrdine;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "data_creazione", nullable = false)
    private Date dataCreazione;

    @Temporal(TemporalType.DATE)
    @Column(name = "data_consegna_prevista")
    private Date dataConsegnaPrevista;

    @Temporal(TemporalType.DATE)
    @Column(name = "data_consegna_effettiva")
    private Date dataConsegnaEffettiva;

    @Basic
    @Column(name = "prezzo_totale", nullable = false)
    private double prezzoTotale;

    @Basic
    @Column(name = "sconto_applicato")
    private double scontoApplicato = 0.0;

    @Basic
    @Column(name = "iva")
    private double iva = 22.0; // IVA al 22%

    @Enumerated(EnumType.STRING)
    @Column(name = "stato_ordine", nullable = false, length = 20)
    private StatoOrdine statoOrdine = StatoOrdine.CREATO;

    @Enumerated(EnumType.STRING)
    @Column(name = "modalita_pagamento", length = 20)
    private ModalitaPagamento modalitaPagamento;

    @Basic
    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @ManyToOne
    @JoinColumn(name = "utente_id")
    private Utente utente;

    @OneToMany(mappedBy = "ordine", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ArticoloOrdine> articoli = new HashSet<>();

    @PrePersist
    private void prePersist() {
        if (dataCreazione == null) {
            dataCreazione = new Date();
        }
        if (numeroOrdine == null) {
            numeroOrdine = generaNumeroOrdine();
        }
        // Calcola data consegna prevista (7 giorni lavorativi)
        if (dataConsegnaPrevista == null) {
            long millisecondi = System.currentTimeMillis() + (7L * 24 * 60 * 60 * 1000);
            dataConsegnaPrevista = new Date(millisecondi);
        }
    }

    private String generaNumeroOrdine() {
        // Formato: ORD + anno + mese + numero casuale
        int anno = Calendar.YEAR;
        int mese = Calendar.MONTH;
        int random = (int) (Math.random() * 9999);
        return String.format("ORD%d%02d%04d", anno, mese, random);
    }

    // Metodi di utilità
    public double getTotaleConIva() {
        return prezzoTotale + (prezzoTotale * iva / 100);
    }

    public double getTotaleScontato() {
        return prezzoTotale - scontoApplicato;
    }

    public int getNumeroArticoli() {
        return articoli.stream()
                .mapToInt(ao -> ao.getArticoloCarrello().getQuantita())
                .sum();
    }

    public boolean isConsegnato() {
        return statoOrdine == StatoOrdine.CONSEGNATO;
    }

    public boolean isAnnullabile() {
        return statoOrdine == StatoOrdine.CREATO || statoOrdine == StatoOrdine.CONFERMATO;
    }

    @Getter
    @ToString
    public enum StatoOrdine {
        CREATO("Creato"),
        CONFERMATO("Confermato"),
        IN_PREPARAZIONE("In preparazione"),
        SPEDITO("Spedito"),
        CONSEGNATO("Consegnato"),
        ANNULLATO("Annullato"),
        RIMBORSATO("Rimborsato");

        private final String descrizione;

        StatoOrdine(String descrizione) {
            this.descrizione = descrizione;
        }
    }

    @Getter
    @ToString
    public enum ModalitaPagamento {
        CONTANTI("Contanti"),
        CARTA_CREDITO("Carta di credito"),
        BONIFICO("Bonifico bancario"),
        PAYPAL("PayPal"),
        CREDITO_UNIVERSITARIO("Credito universitario");

        private final String descrizione;

        ModalitaPagamento(String descrizione) {
            this.descrizione = descrizione;
        }
    }
}
