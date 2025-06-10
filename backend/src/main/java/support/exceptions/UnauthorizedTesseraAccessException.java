package support.exceptions;


public class UnauthorizedTesseraAccessException extends Exception {

    private static final long serialVersionUID = 1L;

    public UnauthorizedTesseraAccessException() {
        super();
    }

    public UnauthorizedTesseraAccessException(String message) {
        super(message);
    }

    public UnauthorizedTesseraAccessException(String message, Throwable cause) {
        super(message, cause);
    }
}
