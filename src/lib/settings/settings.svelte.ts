import { Persisted } from '../persisted.svelte';
import { DEFAULT_SETTINGS, type AppSettings } from './defaults';

export const settings = new Persisted<AppSettings>('settings', DEFAULT_SETTINGS);

/** Read a dotted path like `appearance.fontScale` out of the settings object. */
export function getSetting(path: string): unknown {
	return path
		.split('.')
		.reduce<unknown>(
			(acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
			settings.value
		);
}

export function setSetting(path: string, value: unknown) {
	const keys = path.split('.');
	const last = keys.pop();
	if (!last) return;
	const target = keys.reduce<Record<string, unknown>>(
		(acc, key) => acc[key] as Record<string, unknown>,
		settings.value as unknown as Record<string, unknown>
	);
	target[last] = value;
}
