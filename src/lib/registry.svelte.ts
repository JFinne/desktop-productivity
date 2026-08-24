/**
 * The one place the app shell learns what tools exist.
 *
 * A tool registers itself (nav entry + optional settings section) from its own
 * module; the sidebar and the settings page just render whatever is registered.
 * Adding a tool therefore means adding a folder under `src/lib/tools/`, a route,
 * and one import in `src/lib/tools/index.ts` — no edits to the shell.
 */
import type { Component } from 'svelte';
import type { IconName } from './components/icons';

export interface Tool {
	id: string;
	label: string;
	/** Route to navigate to, e.g. `/focus`. */
	path: string;
	icon: IconName;
	/** Lower sorts first in the sidebar. */
	order: number;
	description?: string;
	/** Optional live badge for the sidebar and title bar, e.g. a countdown. */
	status?: () => string | null;
}

/** A settings control, addressed by a dotted path into the settings object. */
export type SettingsField =
	| { kind: 'toggle'; path: string; label: string; help?: string }
	| {
			kind: 'select';
			path: string;
			label: string;
			/** A function when the choices change at runtime, e.g. imported files. */
			options: SelectOption[] | (() => SelectOption[]);
			help?: string;
	  }
	| {
			kind: 'number';
			path: string;
			label: string;
			min: number;
			max: number;
			step?: number;
			suffix?: string;
			help?: string;
	  }
	| {
			kind: 'slider';
			path: string;
			label: string;
			min: number;
			max: number;
			step?: number;
			format?: (value: number) => string;
			help?: string;
	  }
	| { kind: 'text'; path: string; label: string; placeholder?: string; help?: string }
	| { kind: 'info'; label: string; value: () => string; help?: string }
	/** An escape hatch for controls the declarative kinds can't express. */
	| { kind: 'custom'; component: Component; help?: string }
	| {
			kind: 'action';
			label: string;
			button: string;
			run: () => void | Promise<void>;
			danger?: boolean;
			disabled?: () => boolean;
			help?: string;
	  };

export interface SelectOption {
	value: string;
	label: string;
}

export interface SettingsSection {
	id: string;
	title: string;
	description?: string;
	order: number;
	fields: SettingsField[];
}

const toolList = $state<Tool[]>([]);
const sectionList = $state<SettingsSection[]>([]);

export function registerTool(tool: Tool) {
	const existing = toolList.findIndex((t) => t.id === tool.id);
	if (existing >= 0) toolList[existing] = tool;
	else toolList.push(tool);
}

export function registerSettingsSection(section: SettingsSection) {
	const existing = sectionList.findIndex((s) => s.id === section.id);
	if (existing >= 0) sectionList[existing] = section;
	else sectionList.push(section);
}

export const registry = {
	get tools() {
		return [...toolList].sort((a, b) => a.order - b.order);
	},
	get sections() {
		return [...sectionList].sort((a, b) => a.order - b.order);
	}
};
