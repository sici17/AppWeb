package is.textdoc;

import is.textdoc.visitor.TextDocumentVisitor;

public interface DocumentElement {
	String getText();

	default CompositeDocumentElement asComposite() {
		return null;
	}


	void accept(TextDocumentVisitor visitor);
}
