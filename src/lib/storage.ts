/**
 * Every persisted thing in Fokus goes through here.
 *
 * Inside Tauri the data lands in JSON files under the OS app-data folder, via
 * the Rust commands in `src-tauri/src/storage.rs`. When the frontend is opened
 * in a plain browser (`npm run dev` without Tauri) it falls back to
 * localStorage, so the UI stays workable without a Rust rebuild.
 */
import { invoke } from '@tauri-apps/api/core';

const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const webKey = (key: string) => `fokus:${key}`;

export async function readRaw(key: string): Promise<string | null> {
	if (!inTauri) return localStorage.getItem(webKey(key));
	return (await invoke<string | null>('read_store', { key })) ?? null;
}

export async function writeRaw(key: string, contents: string): Promise<void> {
	if (!inTauri) {
		localStorage.setItem(webKey(key), contents);
		return;
	}
	await invoke('write_store', { key, contents });
}

export async function deleteStore(key: string): Promise<void> {
	if (!inTauri) {
		localStorage.removeItem(webKey(key));
		return;
	}
	await invoke('delete_store', { key });
}

/** Human-readable path to the data folder, for display in Settings. */
export async function storeLocation(): Promise<string> {
	if (!inTauri) return 'browser localStorage (running outside Tauri)';
	return await invoke<string>('store_location');
}

export async function readJson<T>(key: string): Promise<T | null> {
	const raw = await readRaw(key);
	if (raw === null) return null;
	try {
		return JSON.parse(raw) as T;
	} catch (err) {
		console.error(`store "${key}" is not valid JSON, ignoring it`, err);
		return null;
	}
}

export async function writeJson(key: string, value: unknown): Promise<void> {
	await writeRaw(key, JSON.stringify(value, null, 2));
}

export { inTauri };
