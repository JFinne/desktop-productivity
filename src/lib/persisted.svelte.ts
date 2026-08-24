import { readJson, writeJson } from './storage';

/** Plain-object deep merge: fills in keys the saved file predates. */
export function withDefaults<T>(saved: unknown, defaults: T): T {
	if (saved === undefined) return structuredClone(defaults);

	// A saved null only survives where the default is itself null, i.e. a slot
	// that is genuinely nullable. Anywhere else it means a corrupt file.
	if (saved === null) return defaults === null ? (null as T) : structuredClone(defaults);

	// `typeof null === 'object'`, so nullable slots must be checked before the
	// object branch — otherwise every one of them gets reset to null on load.
	if (defaults === null) return saved as T;

	// Scalars and arrays are taken wholesale; only plain objects are merged.
	if (typeof defaults !== 'object' || Array.isArray(defaults)) return saved as T;
	if (typeof saved !== 'object' || Array.isArray(saved)) return structuredClone(defaults);

	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(defaults as Record<string, unknown>)) {
		out[k] = withDefaults((saved as Record<string, unknown>)[k], v);
	}
	return out as T;
}

/**
 * A `$state` value mirrored to a JSON store on disk.
 *
 * Reads happen once at construction; writes are debounced so dragging a slider
 * does not hammer the filesystem. Nested mutations count — the save effect
 * walks the whole value, so `settings.value.pomodoro.focusMinutes = 30` saves.
 */
export class Persisted<T> {
	value = $state() as T;
	loaded = $state(false);

	#key: string;
	#defaults: T;
	#timer: ReturnType<typeof setTimeout> | null = null;
	#delay: number;

	constructor(key: string, defaults: T, { debounceMs = 250 } = {}) {
		this.#key = key;
		this.#defaults = defaults;
		this.#delay = debounceMs;
		this.value = structuredClone(defaults);

		void this.#load();

		$effect.root(() => {
			$effect(() => {
				// Touch every nested field so any mutation re-runs this effect.
				JSON.stringify(this.value);
				if (this.loaded) this.#scheduleSave();
			});
		});
	}

	async #load() {
		const saved = await readJson<unknown>(this.#key);
		this.value = withDefaults(saved, this.#defaults);
		this.loaded = true;
	}

	#scheduleSave() {
		if (this.#timer) clearTimeout(this.#timer);
		this.#timer = setTimeout(() => void this.flush(), this.#delay);
	}

	/** Write immediately, skipping the debounce. */
	async flush() {
		if (this.#timer) {
			clearTimeout(this.#timer);
			this.#timer = null;
		}
		await writeJson(this.#key, this.value);
	}

	reset() {
		this.value = structuredClone(this.#defaults);
	}
}
