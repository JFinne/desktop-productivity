/**
 * Alarm sounds imported from the user's own audio files.
 *
 * Picking a file copies it into the app data folder (see `src-tauri/src/sounds.rs`),
 * so the alarm survives the original being moved or deleted. Playback reads the
 * bytes back through Rust and wraps them in a blob URL, which avoids opening a
 * filesystem scope to arbitrary paths.
 */
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { inTauri } from '$lib/storage';

export interface CustomSound {
	id: string;
	name: string;
	extension: string;
}

/** Settings store `soundId` as `custom:<id>` for imported files. */
export const CUSTOM_PREFIX = 'custom:';

export const isCustomSound = (soundId: string) => soundId.startsWith(CUSTOM_PREFIX);
export const customSoundId = (soundId: string) => soundId.slice(CUSTOM_PREFIX.length);

const list = $state<CustomSound[]>([]);
const blobUrls = new Map<string, string>();

export const customSounds = {
	get all(): CustomSound[] {
		return list;
	},
	find(id: string) {
		return list.find((s) => s.id === id);
	}
};

export async function refreshCustomSounds(): Promise<void> {
	if (!inTauri) return;
	try {
		const found = await invoke<CustomSound[]>('list_custom_sounds');
		list.splice(0, list.length, ...found);
	} catch (err) {
		console.error('could not list imported sounds', err);
	}
}

/** Opens the file picker and imports the chosen file. Returns null if cancelled. */
export async function importCustomSound(): Promise<CustomSound | null> {
	if (!inTauri) return null;

	const picked = await open({
		multiple: false,
		directory: false,
		title: 'Choose an alarm sound',
		filters: [
			{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'webm'] }
		]
	});
	if (typeof picked !== 'string') return null;

	const sound = await invoke<CustomSound>('import_custom_sound', { path: picked });
	await refreshCustomSounds();
	return sound;
}

export async function removeCustomSound(id: string): Promise<void> {
	if (!inTauri) return;
	await invoke('delete_custom_sound', { id });
	const url = blobUrls.get(id);
	if (url) {
		URL.revokeObjectURL(url);
		blobUrls.delete(id);
	}
	await refreshCustomSounds();
}

/** Blob URL for an imported sound, fetched and cached on first use. */
async function urlFor(id: string): Promise<string | null> {
	const cached = blobUrls.get(id);
	if (cached) return cached;

	try {
		const bytes = await invoke<ArrayBuffer>('read_custom_sound', { id });
		const url = URL.createObjectURL(new Blob([bytes]));
		blobUrls.set(id, url);
		return url;
	} catch (err) {
		console.error(`could not load imported sound "${id}"`, err);
		return null;
	}
}

/** Fetch ahead of time so the alarm isn't late on its first play. */
export async function preloadCustomSound(id: string): Promise<void> {
	await urlFor(id);
}

export async function playCustomSound(id: string, volume: number): Promise<void> {
	const url = await urlFor(id);
	if (!url) return;

	const audio = new Audio(url);
	audio.volume = Math.min(1, Math.max(0, volume));
	try {
		await audio.play();
	} catch (err) {
		console.error('could not play imported sound', err);
	}
}

void refreshCustomSounds();
