import * as api from './api';
import type { NoteHit, NoteMeta } from './api';

/**
 * The open note and the list around it.
 *
 * Note text lives here rather than in the `Persisted` JSON layer because each
 * note is its own file on disk. Saves are debounced while typing and flushed
 * whenever focus moves to another note, so switching never loses a keystroke.
 */
class NotesStore {
	notes = $state<NoteMeta[]>([]);
	activeTitle = $state<string | null>(null);
	contents = $state('');
	backlinks = $state<NoteHit[]>([]);
	loaded = $state(false);
	saving = $state(false);

	#saveTimer: ReturnType<typeof setTimeout> | null = null;
	/** Which note the buffered text belongs to, so a late save can't cross notes. */
	#bufferedFor: string | null = null;

	get titles(): string[] {
		return this.notes.map((n) => n.title);
	}

	async refresh() {
		this.notes = await api.listNotes();
		this.loaded = true;
	}

	async open(title: string) {
		if (this.activeTitle === title) return;
		await this.flush();

		// Read first, then publish both fields in one synchronous step. Setting
		// `activeTitle` before the await let the editor's sync effect run while
		// `contents` still held the previous note — so the old text would be
		// saved under the new note's name on the next keystroke.
		const text = await api.readNote(title);
		this.activeTitle = title;
		this.contents = text;
		this.#bufferedFor = title;
		void this.loadBacklinks();
	}

	async loadBacklinks() {
		const title = this.activeTitle;
		if (!title) {
			this.backlinks = [];
			return;
		}
		const found = await api.backlinksTo(title);
		// A slow scan must not overwrite the panel for a note opened since.
		if (this.activeTitle === title) this.backlinks = found;
	}

	/** Called on every keystroke; the write itself is debounced. */
	edit(next: string) {
		this.contents = next;
		this.#bufferedFor = this.activeTitle;
		if (this.#saveTimer) clearTimeout(this.#saveTimer);
		this.#saveTimer = setTimeout(() => void this.flush(), 600);
	}

	async flush() {
		if (this.#saveTimer) {
			clearTimeout(this.#saveTimer);
			this.#saveTimer = null;
		}
		const title = this.#bufferedFor;
		if (!title) return;

		this.saving = true;
		try {
			await api.writeNote(title, this.contents);
			await this.refresh();
		} finally {
			this.saving = false;
		}
	}

	async create(title = 'Untitled') {
		await this.flush();
		const note = await api.createNote(title);
		await this.refresh();
		this.activeTitle = note.title;
		this.contents = '';
		this.#bufferedFor = note.title;
		this.backlinks = [];
		// A note created by following a [[link]] already has a backlink, so this
		// has to run here too, not only in `open`.
		void this.loadBacklinks();
		return note;
	}

	/** Opens a `[[link]]` target, creating the note if it doesn't exist yet. */
	async openOrCreate(title: string) {
		const existing = this.notes.find((n) => n.title.toLowerCase() === title.toLowerCase());
		if (existing) {
			await this.open(existing.title);
			return;
		}
		await this.create(title);
	}

	async rename(to: string) {
		const from = this.activeTitle;
		if (!from || from === to.trim()) return;
		await this.flush();
		const settled = await api.renameNote(from, to);
		this.activeTitle = settled;
		this.#bufferedFor = settled;
		await this.refresh();
		void this.loadBacklinks();
	}

	async remove(title: string) {
		if (this.#bufferedFor === title) {
			// Drop the buffer first, or the debounced save would recreate the file.
			if (this.#saveTimer) clearTimeout(this.#saveTimer);
			this.#saveTimer = null;
			this.#bufferedFor = null;
		}
		await api.deleteNote(title);
		if (this.activeTitle === title) {
			this.activeTitle = null;
			this.contents = '';
			this.backlinks = [];
		}
		await this.refresh();
	}

	search(query: string): Promise<NoteHit[]> {
		return api.searchNotes(query);
	}
}

export const notesStore = new NotesStore();
