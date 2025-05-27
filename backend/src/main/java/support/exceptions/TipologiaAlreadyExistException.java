package support.exceptions;

public class TipologiaAlreadyExistException extends Exception {

    /**
     * 
     */
    private static final long serialVersionUID = 1L;

    public TipologiaAlreadyExistException() {
        super();
    }

    public TipologiaAlreadyExistException(String message) {
        super(message);
    }
}