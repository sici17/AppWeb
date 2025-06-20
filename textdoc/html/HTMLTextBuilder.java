package is.textdoc.html;

import is.textdoc.builder.DocumentBuilder;

import java.io.PrintWriter;

public class HTMLTextBuilder implements DocumentBuilder {
    private final PrintWriter pw;

    public HTMLTextBuilder(PrintWriter pw) {
        this.pw = pw;
    }

    @Override
    public void openDocument(String title) {
        pw.println("<html><head><title>"+title+"</title></head>");
        pw.println("<body>");
        pw.println("<h1>" + title + "</h1>");

    }

    @Override
    public void closeDocument() {
        pw.println("</body></html>");
        pw.flush();
        pw.close();

    }

    @Override
    public void openSection(String title) {
        pw.println("<h2>" + title + "</h2>");

    }

    @Override
    public void closeSection() {

    }

    @Override
    public void openSubsection(String title) {

        pw.println("<h3>" + title + "</h3>");
    }

    @Override
    public void closeSubsection() {

    }

    @Override
    public void addParagraph(String text) {
        pw.print(text);
        pw.println("<br/>");

    }

}
