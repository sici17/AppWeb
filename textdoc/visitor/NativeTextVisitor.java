package is.textdoc.visitor;

import is.textdoc.*;
import is.textdoc.visitor.TextDocumentVisitor;

import java.io.PrintStream;
import java.io.PrintWriter;

public class NativeTextVisitor implements TextDocumentVisitor {

	private final PrintWriter pw;

	public NativeTextVisitor(PrintWriter pw) {
		this.pw = pw;
	}

	public NativeTextVisitor(PrintStream ps) {
		pw = new PrintWriter(ps);
	}

	@Override
	public void visit(TextDocument d) {
		pw.println("<Document>");
		pw.println(d.getTitle());
		for (DocumentElement de : d)
			de.accept(this);
		pw.println("</Document>");
		pw.flush();

	}

	@Override
	public void visit(Section s) {

		pw.println("<Section>");
		pw.println(s.getTitle());
		for (DocumentElement de : s)
			de.accept(this);
		pw.println("</Section>");
	}

	@Override
	public void visit(SubSection sub) {
		pw.println("<SubSection>");
		pw.println(sub.getTitle());
		for (DocumentElement de : sub)
			de.accept(this);
		pw.println("</SubSection>");
	}

	@Override
	public void visit(Paragraph p) {
		pw.println("<Paragraph>");
		pw.println(p.getText());
		pw.println("</Paragraph>");
	}

}
