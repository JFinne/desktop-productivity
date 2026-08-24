import { todayISO, type ISODate } from '$lib/date';
import { Persisted } from '$lib/persisted.svelte';
import { settings } from '$lib/settings/settings.svelte';

/**
 * Category colours are theme token names rather than literal colours, so a
 * category keeps its meaning when the theme changes.
 */
export const CATEGORY_COLORS = ['accent', 'info', 'success', 'warning', 'danger', 'muted'] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export function colorVar(color: CategoryColor): string {
	return color === 'muted' ? 'var(--text-muted)' : `var(--${color})`;
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
