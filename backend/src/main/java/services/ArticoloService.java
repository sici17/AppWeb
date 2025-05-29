package services;

import jakarta.transaction.Transactional;
import repositories.*;
import support.exceptions.ArticoloEsistenteException;
import support.exceptions.ArticoloNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import entities.*;

import java.util.List;

@Service
public class ArticoloService {

    private final ArticoloRepository articoloRepository;

    @Autowired
    public ArticoloService(ArticoloRepository articoloRepository) {
        this.articoloRepository = articoloRepository;
    }

    @Transactional
    public Articolo create(Articolo articolo) throws ArticoloEsistenteException {
        return articoloRepository.save(articolo);
    }

    @Transactional
    public void deleteArticolo(int id) throws ArticoloNotFoundException {
        articoloRepository.deleteById(id);
    }

    @Transactional
    public List<Articolo> findAll(){
       return articoloRepository.findAll();
    }

    @Transactional
    public Articolo findById(int id) throws ArticoloNotFoundException{
        return articoloRepository.findById(id).orElseThrow(ArticoloNotFoundException::new);
    }

    @Transactional
    public List<Articolo> findByNomeAndPrezzoAndCategoria(String nome, double prezzo, Articolo.CategoriaArticolo categoria){
        return articoloRepository.findByNomeAndPrezzoAndCategoria(nome,prezzo,categoria);
    }

    @Transactional
    public List<Articolo> findByNome(String nome) {
        return articoloRepository.findByNome(nome);
    }

    @Transactional
    public List<Articolo> findByPrezzoBetween(double prezzoMin, double prezzoMax) {
        return articoloRepository.findByPrezzoBetween(prezzoMin, prezzoMax);
    }

    @Transactional
    public Articolo updateArticolo(int id, Articolo articoloDettagli) throws ArticoloNotFoundException {
        Articolo articolo = articoloRepository.findById(id).orElseThrow(ArticoloNotFoundException::new);

        articolo.setNome(articoloDettagli.getNome());
        articolo.setPrezzo(articoloDettagli.getPrezzo());
        articolo.setCategoria(articoloDettagli.getCategoria());
        articolo.setDescrizione(articoloDettagli.getDescrizione());
        articolo.setMarca(articoloDettagli.getMarca());
        articolo.setGiacenza(articoloDettagli.getGiacenza());

        return articoloRepository.save(articolo);
    }

    @Transactional
    public List<Articolo> findByCategoria(Articolo.CategoriaArticolo categoria) {
        return articoloRepository.findByCategoria(categoria);
    }
}