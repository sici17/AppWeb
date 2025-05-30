// backend/src/main/java/support/exceptions/PrestitoNotFoundException.java

package support.exceptions;

public class PrestitoNotFoundException extends Exception {

    private static final long serialVersionUID = 1L;

    public PrestitoNotFoundException() {
        super();
    }

    public PrestitoNotFoundException(String message) {
        super(message);
    }

    public PrestitoNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}