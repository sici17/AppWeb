package is.textdoc.txt;

import is.textdoc.builder.DocumentBuilder;

import java.io.PrintWriter;

public class PlainTextBuilder implements DocumentBuilder {

    private final PrintWriter pw;

    public PlainTextBuilder(PrintWriter pw) {
        this.pw = pw;
    }

    @Override
    public void openDocument(String title) {
        pw.println("Title: " + title);

    }

    @Override
    public void closeDocument() {
        pw.flush();
        pw.close();
    }

    @Override
    public void openSection(String title) {
        pw.println("Section: " + title);

    }

    @Override
    public void closeSection() {

    }

    @Override
    public void openSubsection(String title) {
        pw.println("Subsection: " + title);

    }

    @Override
    public void closeSubsection() {

    }

    @Override
    public void addParagraph(String text) {
        pw.println(text);

    }
}
