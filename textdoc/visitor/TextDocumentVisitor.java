package is.textdoc.visitor;

import is.textdoc.Paragraph;
import is.textdoc.Section;
import is.textdoc.SubSection;
import is.textdoc.TextDocument;

public interface TextDocumentVisitor {
	void visit(TextDocument d);

	void visit(Section s);

	void visit(SubSection sub);

	void visit(Paragraph p);
}
