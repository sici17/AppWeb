package is.textdoc.json;

import java.io.PrintWriter;
import java.util.Map;

import javax.json.Json;
import javax.json.stream.JsonGenerator;
import javax.json.stream.JsonGeneratorFactory;

import is.textdoc.builder.DocumentBuilder;

public class JsonTextBuilder implements DocumentBuilder {
	JsonGenerator gen;

	public JsonTextBuilder(PrintWriter pw) {
		Map<String, Object> properties = Map.of(JsonGenerator.PRETTY_PRINTING, true);
		JsonGeneratorFactory jgf = Json.createGeneratorFactory(properties);
		gen = jgf.createGenerator(pw);

	}

	@Override
	public void openDocument(String title) {

		gen.writeStartObject().write("title", title.trim());
		gen.writeStartArray("content");

	}

	@Override
	public void closeDocument() {

		gen.writeEnd().writeEnd();
		gen.close();
	}

	@Override
	public void openSection(String title) {
		gen.writeStartObject().write("title", title.trim());
		gen.writeStartArray("content");

	}

	@Override
	public void closeSection() {
		gen.writeEnd().writeEnd();

	}

	@Override
	public void openSubsection(String title) {
		gen.writeStartObject().write("title", title.trim());
		gen.writeStartArray("content");

	}

	@Override
	public void closeSubsection() {
		gen.writeEnd().writeEnd();
	}

	@Override
	public void addParagraph(String text) {
		gen.write(text.trim());
	}
}
