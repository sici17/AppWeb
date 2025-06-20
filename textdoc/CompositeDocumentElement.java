package is.textdoc;

public interface CompositeDocumentElement extends DocumentElement,
		Iterable<DocumentElement> {
	
	DocumentElement getChild(int i);

	@Override
	default CompositeDocumentElement asComposite() {
		return this;
	}

	void addChild(DocumentElement el);

	void removeChild(int i);

	int getChildrenCount();

}
