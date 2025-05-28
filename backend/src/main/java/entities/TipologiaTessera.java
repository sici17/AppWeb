package entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    // 🆕 NUOVO CAMPO: Tipi di utente che possono richiedere questa tessera
    @ElementCollection(fetch = FetchType.EAGER)  // 🔥 EAGER LOADING
    @Enumerated(EnumType.STRING)
    @CollectionTable(
        name = "tipologia_utenti_ammessi", 
        schema = "dbprova",
        joinColumns = @JoinColumn(name = "tipologia_tessera_id")
    )
    @Column(name = "tipo_utente_ammesso")
    private Set<Utente.TipoUtente> tipiUtentiAmmessi = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "tipologia")
    private List<TesseraLibreria> tessere;

    // Metodi di utilità esistenti
    public boolean isPagamento() {
        return costoAnnuale > 0;
    }

    public boolean isRinnovoConsentito() {
        return maxRinnovi > 0;
    }

    // 🆕 NUOVI METODI DI UTILITÀ
    
    /**
     * Verifica se un tipo di utente può richiedere questa tessera
     */
    public boolean isAccessibileA(Utente.TipoUtente tipoUtente) {
        // TEMPORANEO: Se non ci sono restrizioni o la collezione è vuota, 
        // permetti accesso a tutti
        if (tipiUtentiAmmessi == null || tipiUtentiAmmessi.isEmpty()) {
            System.out.println("⚠️ Nessuna restrizione configurata per " + this.nome + " - accesso consentito");
            return true;
        }
        
        boolean hasAccess = tipiUtentiAmmessi.contains(tipoUtente);
        System.out.println("🔍 Controllo accesso " + this.nome + " per " + tipoUtente + ": " + hasAccess);
        System.out.println("🔍 Tipi ammessi: " + tipiUtentiAmmessi);
        
        return hasAccess;
    }
    /**
     * Aggiunge un tipo di utente che può accedere a questa tessera
     */
    public void addTipoUtenteAmmesso(Utente.TipoUtente tipoUtente) {
        if (tipiUtentiAmmessi == null) {
            tipiUtentiAmmessi = new HashSet<>();
        }
        tipiUtentiAmmessi.add(tipoUtente);
    }

    /**
     * Rimuove un tipo di utente dalla lista degli ammessi
     */
    public void removeTipoUtenteAmmesso(Utente.TipoUtente tipoUtente) {
        if (tipiUtentiAmmessi != null) {
            tipiUtentiAmmessi.remove(tipoUtente);
        }
    }

    /**
     * Imposta i tipi di utente ammessi (sostituisce la lista esistente)
     */
    public void setTipiUtentiAmmessi(Set<Utente.TipoUtente> tipiUtenti) {
        this.tipiUtentiAmmessi = tipiUtenti != null ? new HashSet<>(tipiUtenti) : new HashSet<>();
    }

    /**
     * Verifica se la tessera è per tutti i tipi di utente
     */
    public boolean isPerTutti() {
        return tipiUtentiAmmessi == null || tipiUtentiAmmessi.isEmpty();
    }

    /**
     * Ottiene una descrizione leggibile dei tipi utente ammessi
     */
    public String getDescrizioneTipiAmmessi() {
        if (isPerTutti()) {
            return "Tutti gli utenti";
        }
        
        if (tipiUtentiAmmessi.size() == 1) {
            return "Solo " + tipiUtentiAmmessi.iterator().next().getDescrizione();
        }
        
        return tipiUtentiAmmessi.stream()
            .map(Utente.TipoUtente::getDescrizione)
            .reduce((a, b) -> a + ", " + b)
            .orElse("Nessuno");
    }
}