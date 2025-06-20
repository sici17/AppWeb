package is.textdoc.parser;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.StringTokenizer;

import is.textdoc.builder.DocumentBuilder;

public class TextDocumentParser {

	private final String urlstring;

	private BufferedReader br;

	private StringTokenizer st;
	private int lineNr = 0;

	private final DocumentBuilder builder;

	private String token;

	public TextDocumentParser(DocumentBuilder builder, String urlstring) {
		this.builder = builder;
		this.urlstring = urlstring;
	}

	public void build() {

		try {
			doParse();
		} catch (TextParseException e) {

			e.printStackTrace();

		}

	}

	private String nextToken() {
		while (st == null || !st.hasMoreTokens()) {

			String line = null;
			try {
				line = br.readLine();
				lineNr++;
			} catch (IOException e) {

				e.printStackTrace();
			}

			if (line == null)
				return null;

			st = new StringTokenizer(line);
		}


		return st.nextToken();

	}

	private void doParse() throws TextParseException {

		URL url;
		try {
			url =   new URI(urlstring).toURL();
			br = new BufferedReader(new InputStreamReader(url.openStream()));
		} catch (IOException e) {
			e.printStackTrace();
			throw new TextParseException("Errore di lettura");

		} catch (URISyntaxException e) {
			throw new RuntimeException(e);
		}
		readDocument();
	}

	private void readDocument() throws TextParseException {
		token = nextToken();
		if (token == null)
			throw new TextParseException("Atteso token");
		if (!token.equals("<Document>"))
			throw new TextParseException("line " + lineNr
					+ " Atteso: <Document> trovato:" + token);

		String tit = readText();
		builder.openDocument(tit);


		if (token == null)
			throw new TextParseException("Atteso token");
		while (!token.equals("</Document>")) {

			if (!token.equals("<Section>"))
				throw new TextParseException("line " + lineNr
						+ " Atteso: <Section> trovato:" + token);
			readSection();
			token = nextToken();
			if (token == null)
				throw new TextParseException("Atteso token");
		}
		builder.closeDocument();
	}

	private void readSection() throws TextParseException {

		String tit = readText();
		builder.openSection(tit);

		if (token == null)
			throw new TextParseException("Atteso token");
		while (!token.equals("</Section>")) {

			if (token.equals("<SubSection>"))
				readSubsection();
			else if (token.equals("<Paragraph>"))
				readParagraph();
			else
				throw new TextParseException("line " + lineNr
						+ " Atteso: <SubSection> o <Paragraph> trovato:"
						+ token);
			token = nextToken();
			if (token == null)
				throw new TextParseException("Atteso token");
		}
		builder.closeSection();
	}

	public String readText() throws TextParseException {
		StringBuilder par = new StringBuilder();
		token = nextToken();
		if (token == null)
			throw new TextParseException("line " + lineNr + " Atteso token");
		while (token.charAt(0) != '<') {


			par.append(" ").append(token);
			//par += " " + token;
			token = nextToken();
			if (token == null)
				throw new TextParseException("line " + lineNr + " Atteso token");
		}
		return par.toString();
	}

	private void readParagraph() throws TextParseException {
		StringBuilder par = new StringBuilder();
		token = nextToken();
		if (token == null)
			throw new TextParseException("line " + lineNr + " Atteso token");
		while (!token.equals("</Paragraph>")) {


			par.append(" ").append(token);
			token = nextToken();
			if (token == null)
				throw new TextParseException("line " + lineNr + " Atteso token");
		}

		builder.addParagraph(par.toString());
	}

	private void readSubsection() throws TextParseException {
		String tit = readText();
		builder.openSubsection(tit);

		if (token == null)
			throw new TextParseException("line " + lineNr + " Atteso token");
		while (!token.equals("</SubSection>")) {

			if (token.equals("<Paragraph>"))
				readParagraph();
			else
				throw new TextParseException("line " + lineNr
						+ " Atteso: <Paragraph> trovato:" + token);
			token = nextToken();
			if (token == null)
				throw new TextParseException("Atteso token");
		}
		builder.closeSubsection();
	}

}