package controller;

import services.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import entities.*;
import jakarta.validation.Valid;
import support.ResponseMessage;
import support.exceptions.*;


@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PreAuthorize("hasRole('utente')")
    @GetMapping()
    public ResponseEntity<?> getCart(){
        try {
            Cart cart = cartService.carrelloUtente();
            return new ResponseEntity<>(cart, HttpStatus.OK);
        }  catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(new ResponseMessage("Errore generico"), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @PostMapping("/add")
    public ResponseEntity<?> addArticolo(@RequestBody @Valid ArticoloCarrelloDTO articoloCarrelloDTO) {
        try {
            cartService.addArticolo(articoloCarrelloDTO);
            return new ResponseEntity<>(new ResponseMessage("Articolo aggiunto al carrello"), HttpStatus.OK);
        } catch (ArticoloNotFoundException e) {
            return new ResponseEntity<>(new ResponseMessage("Articolo non trovato"), HttpStatus.NOT_FOUND);
        }catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(new ResponseMessage("Errore nell'aggiunta dell'articolo al carrello"), HttpStatus.BAD_REQUEST);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @PostMapping("/remove")
    public ResponseEntity<?> rimuoviArticolo(@RequestBody @Valid ArticoloCarrelloDTO articoloCarrello) {
        try {
            cartService.rimuoviArticolo(articoloCarrello);
            return new ResponseEntity<>(new ResponseMessage("Articolo rimosso dal carrello"), HttpStatus.OK);
        }
        catch (ArticoloNotFoundException e){
            return new ResponseEntity<>(new ResponseMessage("Articolo non trovato"), HttpStatus.NOT_FOUND);
        }
        catch (IllegalStateException e){
            return new ResponseEntity<>(new ResponseMessage("Stato inconsistente"), HttpStatus.BAD_REQUEST);
        }
        catch (Exception e ) {
            return new ResponseEntity<>(new ResponseMessage("Errore nella rimozione dell'articolo dal carrello"), HttpStatus.BAD_REQUEST);
        }
    }

    @PreAuthorize("hasRole('utente')")
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody @Valid Cart cart) {
        try {
            Ordine ordine = cartService.checkout(cart);
            if (ordine != null) {
                return new ResponseEntity<>(ordine, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(new ResponseMessage("Errore nel checkout"), HttpStatus.BAD_REQUEST);
            }
        }
        catch(QuantitaErrata q){
            return new ResponseEntity<>(new ResponseMessage("Quantita errata"), HttpStatus.BAD_REQUEST);
        }
        catch(EmptyCart ep){
            return new ResponseEntity<>(new ResponseMessage("Carrello vuoto"), HttpStatus.BAD_REQUEST);
        }
        catch (Exception e) {
            return new ResponseEntity<>(new ResponseMessage("Errore nel checkout"), HttpStatus.BAD_REQUEST);
        }
    }
}
