package services;

import jakarta.persistence.OptimisticLockException;
import repositories.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import support.auth.Utils;
import support.exceptions.*;

import entities.*;

import java.util.Date;
import java.util.List;

@Service
public class TesseraLibreriaService {

    private final TesseraLibreriaRepository tesseraLibreriaRepository;
    private final UtenteRepository utenteRepository;
    private final TipologiaTesseraRepository tipologiaTesseraRepository;

    @Autowired
    public TesseraLibreriaService(TesseraLibreriaRepository tesseraLibreriaRepository, UtenteRepository utenteRepository, TipologiaTesseraRepository tipologiaTesseraRepository) {
        this.tesseraLibreriaRepository = tesseraLibreriaRepository;
        this.utenteRepository = utenteRepository;
        this.tipologiaTesseraRepository = tipologiaTesseraRepository;
    }

    @Transactional(readOnly = true)
    public List<TesseraLibreria> getAllTessere() {
        return tesseraLibreriaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public TesseraLibreria getTesseraById(int id) throws TesseraNotFoundException {
        return tesseraLibreriaRepository.findById(id).orElseThrow(TesseraNotFoundException::new);
    }

    @Transactional
    public TesseraLibreria createTessera(TesseraLibreria tessera) throws UserNotFoundException, TipologiaNotFoundException, TipologiaAlreadyExistException {
        System.out.println("=== SERVICE: CREAZIONE TESSERA ===");
        
        // Ottieni l'utente dal token JWT
        int userId = Utils.getId();
        System.out.println("User ID dal token: " + userId);
        
        Utente utente = utenteRepository.findById(userId).orElseThrow(() -> {
            System.err.println("Utente non trovato con ID: " + userId);
            return new UserNotFoundException();
        });
        System.out.println("Utente trovato: " + utente.getNome() + " " + utente.getCognome());
        
        // Verifica che la tipologia esista
        if (tessera.getTipologia() == null || tessera.getTipologia().getId() == 0) {
            System.err.println("Tipologia tessera mancante o ID non valido");
            throw new TipologiaNotFoundException();
        }
        
        int tipologiaId = tessera.getTipologia().getId();
        System.out.println("Tipologia ID richiesta: " + tipologiaId);
        
        TipologiaTessera tipologia = tipologiaTesseraRepository.findById(tipologiaId).orElseThrow(() -> {
            System.err.println("Tipologia non trovata con ID: " + tipologiaId);
            return new TipologiaNotFoundException();
        });
        System.out.println("Tipologia trovata: " + tipologia.getNome());
        
        // Verifica se l'utente ha già una tessera di questo tipo attiva
        List<TesseraLibreria> tessereEsistenti = tesseraLibreriaRepository.findByUtente(utente);
        boolean haGiaTipologia = tessereEsistenti.stream()
            .anyMatch(t -> t.getTipologia().getId() == tipologiaId && t.getStato() == TesseraLibreria.StatoTessera.ATTIVA);
        
        if (haGiaTipologia) {
            System.err.println("L'utente ha già una tessera attiva di tipo: " + tipologia.getNome());
            throw new TipologiaAlreadyExistException();
        }
        
        // Crea la nuova tessera
        TesseraLibreria nuovaTessera = new TesseraLibreria();
        nuovaTessera.setUtente(utente);
        nuovaTessera.setTipologia(tipologia);
        nuovaTessera.setCreditiRimanenti(tipologia.getCreditiMensili());
        nuovaTessera.setDataEmissione(new Date());
        nuovaTessera.setStato(TesseraLibreria.StatoTessera.ATTIVA);
        nuovaTessera.setRinnovoAutomatico(tipologia.isRinnovoAutomatico());

        System.out.println("Creazione tessera:");
        System.out.println("- Utente: " + utente.getNome() + " " + utente.getCognome());
        System.out.println("- Tipologia: " + tipologia.getNome());
        System.out.println("- Crediti iniziali: " + tipologia.getCreditiMensili());
        
        TesseraLibreria tesseraSalvata = tesseraLibreriaRepository.save(nuovaTessera);
        System.out.println("Tessera salvata con ID: " + tesseraSalvata.getId());
        System.out.println("Numero tessera generato: " + tesseraSalvata.getNumeroTessera());
        
        return tesseraSalvata;
    }

    @Transactional
    public void deleteTessera(int id) {
        tesseraLibreriaRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<TesseraLibreria> getTessereByUtente(Utente utente) {
        return tesseraLibreriaRepository.findByUtente(utente);
    }

    @Transactional(readOnly = true)
    public List<TesseraLibreria> getTessereUtenteConCrediti(Utente utente) {
        return tesseraLibreriaRepository.findByUtenteAndCreditiRimanentiGreaterThanZero(utente);
    }

    @Transactional(rollbackFor = OptimisticLockException.class)
    public void scalaCredito(int id) throws UserNotFoundException , InsufficientCreditsException {
        Utente u = utenteRepository.findById(id).orElseThrow(UserNotFoundException::new);
        List<TesseraLibreria> tessereAttive = tesseraLibreriaRepository.findByUtenteAndCreditiRimanentiGreaterThanZero(u);
        if (tessereAttive.isEmpty()) throw new InsufficientCreditsException();

        TesseraLibreria daScalare = tessereAttive.get(0);
        daScalare.setCreditiRimanenti(daScalare.getCreditiRimanenti()-1);
        tesseraLibreriaRepository.save(daScalare);
    }
}