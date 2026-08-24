import { isHex, readableOn } from '$lib/color';
import { todayISO, type ISODate } from '$lib/date';
import { Persisted } from '$lib/persisted.svelte';
import { settings } from '$lib/settings/settings.svelte';
import { getTheme, type ThemeTokens } from '$lib/themes/themes';

/**
 * A category colour is either a literal hex (what the picker writes) or one of
 * the theme token names below, which older category files still use. Tokens
 * follow the theme; a hex stays put, which is the whole point of choosing one.
 */
export type CategoryColor = string;

/** Token names that map straight onto a theme token of the same name. */
const DIRECT_TOKENS = ['accent', 'info', 'success', 'warning', 'danger'] as const;
type DirectToken = (typeof DIRECT_TOKENS)[number];

const isDirectToken = (color: string): color is DirectToken =>
	(DIRECT_TOKENS as readonly string[]).includes(color);

/** The Google-Suite-style palette offered in the picker. */
export const CATEGORY_PRESETS: { name: string; hex: string }[] = [
	{ name: 'Tomato', hex: '#E5544B' },
	{ name: 'Tangerine', hex: '#E8913A' },
	{ name: 'Banana', hex: '#E3B341' },
	{ name: 'Sage', hex: '#8FBF6B' },
	{ name: 'Basil', hex: '#4CAF7D' },
	{ name: 'Teal', hex: '#3FB4B0' },
	{ name: 'Peacock', hex: '#3E9FD6' },
	{ name: 'Blueberry', hex: '#5B7FE0' },
	{ name: 'Lavender', hex: '#8E8FE0' },
	{ name: 'Grape', hex: '#A96BD1' },
	{ name: 'Rose', hex: '#DE6BA5' },
	{ name: 'Graphite', hex: '#8C97A3' }
];

export const DEFAULT_CATEGORY_COLOR = CATEGORY_PRESETS[7].hex;

function activeTokens(): ThemeTokens {
	return getTheme(settings.value.appearance.themeId).tokens;
}

/** A concrete hex for the colour, resolving theme tokens against the live theme. */
export function resolveColor(color: CategoryColor): string {
	if (isHex(color)) return color;
	const tokens = activeTokens();
	// 'muted' is the one token whose name differs from its key.
	if (color === 'muted') return tokens.textMuted;
	return isDirectToken(color) ? tokens[color] : tokens.accent;
}

/** For dots and swatches, where the colour is shown as a fill. */
export function colorVar(color: CategoryColor): string {
	if (isHex(color)) return color;
	if (color === 'muted') return 'var(--text-muted)';
	return isDirectToken(color) ? `var(--${color})` : 'var(--accent)';
}

/**
 * For places that render the colour as *text*. A pale banana on Classic Light
 * or a deep grape on Abyss would be unreadable, so this nudges the colour
 * toward the background's opposite until it clears AA, keeping the hue.
 */
export function colorText(color: CategoryColor): string {
	return readableOn(resolveColor(color), activeTokens().bg);
}

export interface Category {
	id: string;
	name: string;
	color: CategoryColor;
}

export interface Task {
	id: string;
	title: string;
	categoryId: string | null;
	done: boolean;
	/** Local `YYYY-MM-DD`, or null for the unscheduled backlog. */
	scheduledFor: ISODate | null;
	createdAt: string;
	completedAt: string | null;
	/** Position within its day. Kept so ordering can become draggable later. */
	order: number;
}

export interface TasksData {
	tasks: Task[];
	categories: Category[];
}

const DEFAULT_DATA: TasksData = {
	tasks: [],
	categories: [
		{ id: 'focus', name: 'Focus', color: 'accent' },
		{ id: 'work', name: 'Work', color: 'info' },
		{ id: 'personal', name: 'Personal', color: 'success' }
	]
};

const uid = () => crypto.randomUUID();

class TaskStore {
	#store = new Persisted<TasksData>('tasks', DEFAULT_DATA);
	#carriedOver = false;

	constructor() {
		$effect.root(() => {
			$effect(() => {
				// Needs both stores: the tasks themselves and the carry-over preference.
				if (this.#store.loaded && settings.loaded && !this.#carriedOver) {
					this.#carriedOver = true;
					this.#carryOverUnfinished();
				}
			});
		});
	}

	get loaded() {
		return this.#store.loaded;
	}

	get tasks(): Task[] {
		return this.#store.value.tasks;
	}

	get categories(): Category[] {
		return this.#store.value.categories;
	}

	category(id: string | null): Category | undefined {
		return id === null ? undefined : this.categories.find((c) => c.id === id);
	}

	/** Unfinished tasks scheduled for today — what the sidebar badge counts. */
	get dueToday(): Task[] {
		const today = todayISO();
		return this.tasks.filter((t) => !t.done && t.scheduledFor === today);
	}

	/**
	 * Anything unfinished from a day that has passed moves to today, so a list
	 * you didn't get through doesn't quietly fall off the bottom of the app.
	 */
	#carryOverUnfinished() {
		if (!settings.value.tasks.carryOverUnfinished) return;
		const today = todayISO();
		for (const task of this.tasks) {
			if (!task.done && task.scheduledFor !== null && task.scheduledFor < today) {
				task.scheduledFor = today;
			}
		}
	}

	#nextOrder(scheduledFor: ISODate | null): number {
		const siblings = this.tasks.filter((t) => t.scheduledFor === scheduledFor);
		return siblings.reduce((max, t) => Math.max(max, t.order), -1) + 1;
	}

	add(
		title: string,
		options: { categoryId?: string | null; scheduledFor?: ISODate | null } = {}
	): Task | null {
		const trimmed = title.trim();
		if (!trimmed) return null;

		const scheduledFor =
			options.scheduledFor === undefined ? todayISO() : options.scheduledFor;

		const task: Task = {
			id: uid(),
			title: trimmed,
			categoryId: options.categoryId ?? null,
			done: false,
			scheduledFor,
			createdAt: new Date().toISOString(),
			completedAt: null,
			order: this.#nextOrder(scheduledFor)
		};

		this.tasks.push(task);
		return task;
	}

	update(id: string, patch: Partial<Omit<Task, 'id'>>) {
		const task = this.tasks.find((t) => t.id === id);
		if (task) Object.assign(task, patch);
	}

	toggle(id: string) {
		const task = this.tasks.find((t) => t.id === id);
		if (!task) return;
		task.done = !task.done;
		task.completedAt = task.done ? new Date().toISOString() : null;
	}

	/** Moving to a different day puts the task at the end of that day's list. */
	schedule(id: string, scheduledFor: ISODate | null) {
		const task = this.tasks.find((t) => t.id === id);
		if (!task || task.scheduledFor === scheduledFor) return;
		task.order = this.#nextOrder(scheduledFor);
		task.scheduledFor = scheduledFor;
	}

	remove(id: string) {
		const index = this.tasks.findIndex((t) => t.id === id);
		if (index >= 0) this.tasks.splice(index, 1);
	}

	clearCompleted() {
		const remaining = this.tasks.filter((t) => !t.done);
		this.#store.value.tasks = remaining;
	}

	addCategory(name: string, color: CategoryColor): Category | null {
		const trimmed = name.trim();
		if (!trimmed) return null;
		const category: Category = { id: uid(), name: trimmed, color };
		this.categories.push(category);
		return category;
	}

	updateCategory(id: string, patch: Partial<Omit<Category, 'id'>>) {
		const category = this.categories.find((c) => c.id === id);
		if (category) Object.assign(category, patch);
	}

	/** Deleting a category leaves its tasks alone; they just become uncategorised. */
	removeCategory(id: string) {
		const index = this.categories.findIndex((c) => c.id === id);
		if (index < 0) return;
		this.categories.splice(index, 1);
		for (const task of this.tasks) {
			if (task.categoryId === id) task.categoryId = null;
		}
	}
}

export const taskStore = new TaskStore();
