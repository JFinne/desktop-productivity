/**
 * Note storage. Inside Tauri these are the Rust commands in
 * `src-tauri/src/notes.rs`, which own `<app data>/notes/*.md`. Outside it —
 * `npm run dev` in a plain browser — the same shape is backed by localStorage so
 * the editor is workable without a Rust rebuild.
 */
import { invoke } from '@tauri-apps/api/core';
import { inTauri } from '$lib/storage';

export interface NoteMeta {
	title: string;
	modified: number;
	excerpt: string;
}

export interface NoteHit {
	title: string;
	line: number;
	snippet: string;
}

const WEB_KEY = 'fokus:notes';

type WebNotes = Record<string, { contents: string; modified: number }>;

const webRead = (): WebNotes => {
	try {
		return JSON.parse(localStorage.getItem(WEB_KEY) ?? '{}') as WebNotes;
	} catch {
		return {};
	}
};
const webWrite = (notes: WebNotes) => localStorage.setItem(WEB_KEY, JSON.stringify(notes));

function excerptOf(contents: string): string {
	const line = contents
		.split('\n')
		.map((l) => l.trim())
		.find((l) => l && !l.startsWith('#'));
	return (line ?? '').slice(0, 120);
}

function webSnippet(line: string, at: number): string {
	const start = Math.max(0, at - 40);
	return (start > 0 ? '…' : '') + line.slice(start, start + 140).trimEnd();
}

export async function listNotes(): Promise<NoteMeta[]> {
	if (inTauri) return await invoke<NoteMeta[]>('list_notes');
	const notes = webRead();
	return Object.entries(notes)
		.map(([title, n]) => ({ title, modified: n.modified, excerpt: excerptOf(n.contents) }))
		.sort((a, b) => b.modified - a.modified);
}

export async function readNote(title: string): Promise<string> {
	if (inTauri) return await invoke<string>('read_note', { title });
	return webRead()[title]?.contents ?? '';
}

export async function writeNote(title: string, contents: string): Promise<void> {
	if (inTauri) {
		await invoke('write_note', { title, contents });
		return;
	}
	const notes = webRead();
	notes[title] = { contents, modified: Date.now() };
	webWrite(notes);
}

export async function createNote(title: string): Promise<NoteMeta> {
	if (inTauri) return await invoke<NoteMeta>('create_note', { title });

	const notes = webRead();
	let name = title;
	let n = 2;
	while (notes[name]) name = `${title} ${n++}`;
	notes[name] = { contents: '', modified: Date.now() };
	webWrite(notes);
	return { title: name, modified: Date.now(), excerpt: '' };
}

export async function renameNote(from: string, to: string): Promise<string> {
	if (inTauri) return await invoke<string>('rename_note', { from, to });

	const notes = webRead();
	if (notes[to] && to !== from) throw new Error(`a note called "${to}" already exists`);
	notes[to] = notes[from];
	if (to !== from) delete notes[from];
	webWrite(notes);
	return to;
}

export async function deleteNote(title: string): Promise<void> {
	if (inTauri) {
		await invoke('delete_note', { title });
		return;
	}
	const notes = webRead();
	delete notes[title];
	webWrite(notes);
}

export async function searchNotes(query: string): Promise<NoteHit[]> {
	const needle = query.trim().toLowerCase();
	if (!needle) return [];
	if (inTauri) return await invoke<NoteHit[]>('search_notes', { query });

	const hits: NoteHit[] = [];
	for (const [title, note] of Object.entries(webRead())) {
		note.contents.split('\n').forEach((line, i) => {
			if (hits.length >= 200) return;
			const at = line.toLowerCase().indexOf(needle);
			if (at >= 0) hits.push({ title, line: i + 1, snippet: webSnippet(line, at) });
		});
	}
	return hits;
}

export async function backlinksTo(title: string): Promise<NoteHit[]> {
	if (inTauri) return await invoke<NoteHit[]>('note_backlinks', { title });

	const target = `[[${title.trim().toLowerCase()}]]`;
	const hits: NoteHit[] = [];
	for (const [source, note] of Object.entries(webRead())) {
		if (source.toLowerCase() === title.trim().toLowerCase()) continue;
		note.contents.split('\n').forEach((line, i) => {
			if (line.toLowerCase().includes(target)) {
				hits.push({ title: source, line: i + 1, snippet: webSnippet(line, 0) });
			}
		});
	}
	return hits;
}

export async function notesLocation(): Promise<string> {
	if (inTauri) return await invoke<string>('notes_location');
	return 'browser localStorage (running outside Tauri)';
}
