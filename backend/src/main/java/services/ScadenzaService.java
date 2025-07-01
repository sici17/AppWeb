package services;

import entities.*;
import repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class ScadenzaService {

    @Autowired private TesseraLibreriaRepository tesseraLibreriaRepository;
    @Autowired private PrestitoRepository prestitoRepository;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void controlloScadenzeGiornaliero() {
        aggiornaStatoTessereScadute();
        aggiornaStatoPrestitiScaduti();
        calcolaMultePrestitiInRitardo();
        rinnovaTessereAutomatiche();
    }

    @Transactional
    public void aggiornaStatoTessereScadute() {
        Date oggi = new Date();
        tesseraLibreriaRepository.findTessereAttive().stream()
            .filter(t -> t.getDataScadenza() != null && t.getDataScadenza().before(oggi))
            .forEach(t -> {
                t.setStato(TesseraLibreria.StatoTessera.SCADUTA);
                tesseraLibreriaRepository.save(t);
            });
    }

    @Transactional
    public void aggiornaStatoPrestitiScaduti() {
        Date oggi = new Date();
        prestitoRepository.findAll().stream()
            .filter(p -> p.getStato() == Prestito.StatoPrestito.ATTIVO)
            .filter(p -> p.getDataScadenza() != null && p.getDataScadenza().before(oggi))
            .forEach(p -> {
                p.setStato(Prestito.StatoPrestito.SCADUTO);
                prestitoRepository.save(p);
            });
    }

    @Transactional
    public void calcolaMultePrestitiInRitardo() {
        Date oggi = new Date();
        prestitoRepository.findAll().stream()
            .filter(p -> p.getStato() == Prestito.StatoPrestito.SCADUTO)
            .filter(p -> p.getDataScadenza() != null)
            .forEach(p -> {
                long giorniRitardo = TimeUnit.DAYS.convert(
                    oggi.getTime() - p.getDataScadenza().getTime(), TimeUnit.MILLISECONDS);
                if (giorniRitardo > 0) {
                    double multaGiornaliera = tesseraLibreriaRepository.findByUtente(p.getUtente())
                        .stream().findFirst()
                        .map(t -> t.getTipologia().getMultaGiornaliera())
                        .orElse(0.50);
                    p.setMulta(giorniRitardo * multaGiornaliera);
                    prestitoRepository.save(p);
                }
            });
    }

    @Transactional
    public void rinnovaTessereAutomatiche() {
        getTessereInScadenzaEntro(30).stream()
            .filter(t -> t.isRinnovoAutomatico() && t.getStato() == TesseraLibreria.StatoTessera.ATTIVA)
            .forEach(t -> {
                Calendar cal = Calendar.getInstance();
                cal.setTime(t.getDataScadenza());
                cal.add(Calendar.YEAR, 1);
                t.setDataScadenza(cal.getTime());
                t.setCreditiRimanenti(t.getTipologia().getCreditiMensili());
                tesseraLibreriaRepository.save(t);
            });
    }

    @Transactional(readOnly = true)
    public List<TesseraLibreria> getTessereInScadenzaEntro(int giorni) {
        Date dataLimite = new Date(System.currentTimeMillis() + (giorni * 86400000L));
        return tesseraLibreriaRepository.findTessereAttive().stream()
            .filter(t -> t.getDataScadenza() != null && t.getDataScadenza().before(dataLimite))
            .sorted(Comparator.comparing(TesseraLibreria::getDataScadenza))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<Prestito> getPrestitiInScadenzaEntro(int giorni) {
        Date dataLimite = new Date(System.currentTimeMillis() + (giorni * 86400000L));
        return prestitoRepository.findAll().stream()
            .filter(p -> p.getStato() == Prestito.StatoPrestito.ATTIVO)
            .filter(p -> p.getDataScadenza() != null && p.getDataScadenza().before(dataLimite))
            .sorted(Comparator.comparing(Prestito::getDataScadenza))
            .toList();
    }
    

    @Transactional(readOnly = true)
    public void inviaNotificheScadenzeImminenti() {
        List<TesseraLibreria> tessereInScadenza = getTessereInScadenzaEntro(7);
        List<Prestito> prestitiInScadenza = getPrestitiInScadenzaEntro(3);
                tessereInScadenza.forEach(t -> {
        });
        
        prestitiInScadenza.forEach(p -> {
        });
    }

    @Transactional
    public Map<String, Object> eseguiControlloManuale() {
        Map<String, Object> risultato = new HashMap<>();
        try {
            controlloScadenzeGiornaliero();
            risultato.put("status", "SUCCESS");
            risultato.put("timestamp", new Date());
        } catch (Exception e) {
            risultato.put("status", "ERROR");
            risultato.put("error", e.getMessage());
        }
        return risultato;
    }
}