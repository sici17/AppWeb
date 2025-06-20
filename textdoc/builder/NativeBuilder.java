package is.textdoc.builder;

import java.io.PrintWriter;

public class NativeBuilder implements DocumentBuilder{
    private final PrintWriter pw;

    public NativeBuilder(PrintWriter pw){
        this.pw = pw;
    }
    @Override
    public void openDocument(String title) {
        pw.print("<Document>");
        pw.println(title);
    }

    @Override
    public void closeDocument() {
        pw.println("</Document>");
        pw.flush();
        pw.close();

    }

    @Override
    public void openSection(String title) {
        pw.print("<Section>");
        pw.println(title);
    }

    @Override
    public void closeSection() {
        pw.println("</Section>");
    }

    @Override
    public void openSubsection(String title) {
        pw.print("<SubSection>");
        pw.println(title);
    }

    @Override
    public void closeSubsection() {
        pw.println("</SubSection>");
    }

    @Override
    public void addParagraph(String text) {
        pw.println("<Paragraph>");
        pw.println(text);
        pw.println("</Paragraph>");
    }
}
