package is.textdoc;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.NoSuchElementException;

public abstract class AbstractCompositeDocumentElement implements CompositeDocumentElement {

	private final  ArrayList<DocumentElement> elements = new ArrayList<>();

	@Override
	public DocumentElement getChild(int i) {
		return elements.get(i);
	}

	@Override
	public void addChild(DocumentElement el) {
		elements.add(el);
	}
	
	@Override
	public void removeChild(int i) {
		 elements
				.remove(i);

	}
	@Override
	public int getChildrenCount() {
		return elements.size();
	}


	@Override
	public Iterator<DocumentElement> iterator() {
		return new InnerIterator();
	}

	private class InnerIterator implements Iterator<DocumentElement> {
		Iterator<DocumentElement> it = elements.iterator();
		private DocumentElement last = null;

		@Override
		public void remove() {
			if (last == null)
				throw new NoSuchElementException();

			it.remove();
			last = null;
		}

		@Override
		public boolean hasNext() {

			return it.hasNext();
		}

		@Override
		public DocumentElement next() {
			last = it.next();
			return last;
		}

	}
	
}
