package services;

import repositories.*;
import support.auth.Utils;
import support.exceptions.*;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import entities.*;

import java.util.*;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final OrdineRepository ordineRepository;
    private final ArticoloRepository articoloRepository;
    private final UtenteRepository utenteRepository;
    private final ArticoloCarrelloRepository articoloCarrelloRepository;

    @Autowired
    public CartService(CartRepository cartRepository, OrdineRepository ordineRepository, ArticoloRepository articoloRepository, UtenteRepository utenteRepository, ArticoloCarrelloRepository articoloCarrelloRepository) {
        this.cartRepository = cartRepository;
        this.ordineRepository = ordineRepository;
        this.articoloRepository = articoloRepository;
        this.utenteRepository = utenteRepository;
        this.articoloCarrelloRepository = articoloCarrelloRepository;
    }

    @Transactional
    public Cart carrelloUtente() throws UserNotFoundException {
        Utente u = utenteRepository.findById(Utils.getId()).orElseThrow(UserNotFoundException::new);
        Cart carrello = cartRepository.findByUtente(u);
        if (carrello == null) {
            carrello = new Cart();
            carrello.setUtente(u);
            cartRepository.save(carrello);
            carrello = cartRepository.findByUtente(u);
        }
        carrello.setArticoli(new HashSet<>(articoloCarrelloRepository.findByCartAndInCarrello(carrello,true)));
        return carrello;
    }

    @Transactional
    public void addArticolo(ArticoloCarrelloDTO articoloCarrelloDTO) throws QuantitaErrata, UserNotFoundException, ArticoloNotFoundException {
        Utente u = utenteRepository.findById(Utils.getId()).orElseThrow(UserNotFoundException::new);
        if (articoloCarrelloDTO.quantita() <= 0) throw new QuantitaErrata("Quantità non valida");

        Cart cart = cartRepository.findByUtente(u);
        if (cart == null) {
            cart = new Cart();
            cart.setUtente(u);
            cartRepository.save(cart);
            cart = cartRepository.findByUtente(u);
        }

        Articolo ar = articoloRepository.findById(articoloCarrelloDTO.idArticolo()).orElseThrow(ArticoloNotFoundException::new);
        boolean presente = false;
        Set<ArticoloCarrello> articoliCarrello =  cart.getArticoli();
        for(ArticoloCarrello ac : articoliCarrello){
            Articolo a = ac.getArticolo();
            if(a.equals(ar)){
                if(ac.isInCarrello()){
                    ac.setQuantita(ac.getQuantita() + articoloCarrelloDTO.quantita());
                    presente = true;
                    break;
                }else
                    if(ac.getQuantita() == articoloCarrelloDTO.quantita()){
                        ac.setInCarrello(true);
                        break;
                    }
            }
        }
        if(!presente){
            ArticoloCarrello articoloCarrello = new ArticoloCarrello();
            articoloCarrello.setCart(cart);
            articoloCarrello.setArticolo(ar);
            articoloCarrello.setQuantita(articoloCarrelloDTO.quantita());
            articoloCarrello.setInCarrello(true);
            articoliCarrello.add(articoloCarrello);
        }

        cartRepository.save(cart);
    }

    @Transactional
    public void rimuoviArticolo(ArticoloCarrelloDTO articoloCarrelloDTO) throws UserNotFoundException, ArticoloNotFoundException {
        Utente u = utenteRepository.findById(Utils.getId()).orElseThrow(UserNotFoundException::new);
        Cart cart = cartRepository.findByUtente(u);
        Set<ArticoloCarrello> articoliCarrello = cart.getArticoli();
        Articolo a = articoloRepository.findById(articoloCarrelloDTO.idArticolo()).orElseThrow(ArticoloNotFoundException::new);

        System.out.println(articoliCarrello);
        for(ArticoloCarrello ac : articoliCarrello){
            if(ac.getArticolo().equals(a) && ac.isInCarrello()){
                System.out.println(ac.getArticolo().equals(a));
                ac.setInCarrello(false);
                return;
            }
        }
        throw new IllegalStateException("Carrello in stato inconsistente");
    }

    @Transactional(rollbackOn = Exception.class)
    public Ordine checkout(Cart c) throws QuantitaErrata, EmptyCart, SessionError, UserNotFoundException {
        Utente u = utenteRepository.findById(Utils.getId()).orElseThrow(UserNotFoundException::new);
        Cart cart = cartRepository.findByUtente(u);
        Set<ArticoloCarrello> articoliCarrello = new HashSet<>(articoloCarrelloRepository.findByCartAndInCarrello(cart,true));
        if (cart == null || articoliCarrello.isEmpty()) throw new EmptyCart("Il carrello è vuoto");

        System.out.println("Articoli presenti, procedo con checkout");

        Ordine ordine = new Ordine();
        ordine.setDataCreazione(new Date());
        ordine.setUtente(u);

        double prezzoTotale = 0.0;

        Set<ArticoloOrdine> articoliOrdine = new HashSet<>();
        for (ArticoloCarrello articoloCarrello : articoloCarrelloRepository.findByCartAndInCarrello(cart, true)) {
            Articolo articolo = articoloCarrello.getArticolo();
            if (articoloCarrello.getQuantita() <= 0)
                throw new QuantitaErrata("Quantità non valida");
            if (articoloCarrello.getQuantita() > articolo.getGiacenza()) {
                throw new QuantitaErrata("Quantità richiesta superiore alla disponibilità dell'articolo: " + articolo.getNome());
            }
            
            ArticoloOrdine ao = new ArticoloOrdine();
            ao.setArticoloCarrello(articoloCarrello);
            ao.setOrdine(ordine);
            articoliOrdine.add(ao);
            prezzoTotale += articoloCarrello.getQuantita() * articolo.getPrezzoScontato();

            articolo.setGiacenza(articolo.getGiacenza() - articoloCarrello.getQuantita());
            articoloRepository.save(articolo);
            articoloCarrello.setInCarrello(false);
            articoloCarrelloRepository.save(articoloCarrello);
        }
        ordine.setArticoli(articoliOrdine);
        ordine.setPrezzoTotale(prezzoTotale);
        ordineRepository.save(ordine);

        cartRepository.save(cart);

        return ordine;
    }
}
