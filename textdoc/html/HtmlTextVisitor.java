package is.textdoc.html;

import is.textdoc.DocumentElement;
import is.textdoc.Paragraph;
import is.textdoc.Section;
import is.textdoc.SubSection;
import is.textdoc.TextDocument;
import is.textdoc.visitor.TextDocumentVisitor;

import java.io.PrintStream;
import java.io.PrintWriter;

public class HtmlTextVisitor implements TextDocumentVisitor {

	private PrintWriter pw;

	public HtmlTextVisitor(PrintWriter pw) {
		this.pw = pw;
	}

	public HtmlTextVisitor(PrintStream ps) {
		pw = new PrintWriter(ps);
	}

	@Override
	public void visit(TextDocument d) {
		pw.println("<html><body>");
		pw.println("<h1>" + d.getTitle() + "</h1>");
		for (DocumentElement de : d)
			de.accept(this);
		pw.println("</body></html>");
		pw.flush();

	}

	@Override
	public void visit(Section s) {

		pw.println("<h2>" + s.getTitle() + "</h2>");
		for (DocumentElement de : s)
			de.accept(this);

	}

	@Override
	public void visit(SubSection sub) {
		pw.println("<h3>" + sub.getTitle() + "</h3>");
		for (DocumentElement de : sub)
			de.accept(this);

	}

	@Override
	public void visit(Paragraph p) {
		pw.println(p.getText() + "<br/>");

	}

}
