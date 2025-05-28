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

@Entity
@Getter
@Setter
@EqualsAndHashCode(exclude = {"cart", "prestiti","tessere","ordini"})
@ToString(exclude = {"cart", "prestiti","tessere","ordini"})
@Table(name = "utente")
public class Utente {
    @Id
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Basic
    @Column(name = "nome", nullable = false, length = 50)
    private String nome;
    
    @Basic
    @Column(name = "cognome", nullable = false, length = 50)
    private String cognome;

    @Basic
    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @Basic
    @Column(name = "matricola", length = 20)
    private String matricola; // matricola universitaria

    @Basic
    @Column(name = "codice_fiscale", length = 16)
    private String codiceFiscale;

    @Basic
    @Column(name = "telefono", length = 20)
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(name = "sesso", nullable = false, length = 25)
    private Sesso sesso;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_utente", nullable = false, length = 25)
    private TipoUtente tipoUtente;

    @OneToMany(mappedBy="utente", cascade = CascadeType.ALL )
    @JsonIgnore
    private List<Prestito> prestiti;

    @OneToMany(mappedBy="utente", cascade = CascadeType.ALL )
    @JsonIgnore
    private List<TesseraLibreria> tessere;

    @OneToOne(mappedBy = "utente", cascade = CascadeType.ALL)
    @JoinColumn(name = "cart_id")
    @JsonIgnore
    private Cart cart;

    @OneToMany(mappedBy = "utente", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnore
    private Set<Ordine> ordini = new HashSet<>();

    public enum Sesso {
        MASCHIO, FEMMINA, ALTRO
    }

    @Getter
    @ToString
    public enum TipoUtente {
        STUDENTE("Studente"),
        DOCENTE("Docente"),
        PERSONALE("Personale tecnico-amministrativo"),
        ESTERNO("Utente esterno");

        private final String descrizione;

        TipoUtente(String descrizione) {
            this.descrizione = descrizione;
        }
    }
}