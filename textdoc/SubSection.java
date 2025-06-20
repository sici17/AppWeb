package is.textdoc;

import is.textdoc.visitor.TextDocumentVisitor;

public final class SubSection extends AbstractCompositeDocumentElement {
	private String title;

	public SubSection(String title) {
		this.title = title;
	}

	public SubSection() {
		this("");
	}

	@Override
	public String getText() {
		return getTitle();
	}

	@Override
	public void addChild(DocumentElement el) {
		if (!(el instanceof Paragraph))
			throw new IllegalArgumentException();
		super.addChild(el);
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String string) {
		title = string;
	}

	@Override
	public void accept(TextDocumentVisitor visitor) {
		visitor.visit(this);
	}
	
	
}
