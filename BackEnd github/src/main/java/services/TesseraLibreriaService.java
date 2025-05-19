package services;

import jakarta.persistence.OptimisticLockException;
import repositories.*;
import support.exceptions.InsufficientCreditsException;

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
    public TesseraLibreria createTessera(TesseraLibreria tessera) throws UserNotFoundException, TipologiaNotFoundException {
        TesseraLibreria ret = new TesseraLibreria();
        ret.setUtente(utenteRepository.findById(Utils.getId()).orElseThrow(UserNotFoundException::new));
        TipologiaTessera t = tipologiaTesseraRepository.findById(tessera.getTipologia().getId()).orElseThrow(TipologiaNotFoundException::new);
        ret.setTipologia(t);
        ret.setCreditiRimanenti(t.getCreditiMensili());
        ret.setDataEmissione(new Date());

        return tesseraLibreriaRepository.save(ret);
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
