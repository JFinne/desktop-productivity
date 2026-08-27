import { compareTimes, todayISO, type ISODate } from '$lib/date';
import { Persisted } from '$lib/persisted.svelte';

/**
 * Events are things that happen at a time, not things you finish.
 *
 * Deliberately a separate store from tasks rather than a flag on `Task`:
 *
 *  - there is no `done` state, so a shared type would carry a field that is
 *    meaningless for half its values;
 *  - an event is pinned to its date. Carry-over walks `taskStore.tasks` only,
 *    so an event physically cannot be swept forward to the next day, however
 *    the to-do carry-over setting is configured. That guarantee comes from the
 *    separation, not from a condition someone could later forget.
 */

export interface FokusEvent {
	id: string;
	title: string;
	/** Local `YYYY-MM-DD`. Never null — an event without a day is a task. */
	date: ISODate;
	/** 24-hour `HH:MM`, or null for an all-day event. */
	start: string | null;
	/** 24-hour `HH:MM`. Only meaningful alongside `start`. */
	end: string | null;
	location: string;
	color: string;
	createdAt: string;
}

export interface EventsData {
	events: FokusEvent[];
}

/** Peacock, so events read as distinct from a task's category colour. */
export const DEFAULT_EVENT_COLOR = '#3E9FD6';

const DEFAULT_DATA: EventsData = { events: [] };

const uid = () => crypto.randomUUID();

/** All-day first, then by start time, then by title. */
function byTime(a: FokusEvent, b: FokusEvent): number {
	const time = compareTimes(a.start, b.start);
	return time !== 0 ? time : a.title.localeCompare(b.title);
}

class EventStore {
	#store = new Persisted<EventsData>('events', DEFAULT_DATA);

	get loaded() {
		return this.#store.loaded;
	}

	get events(): FokusEvent[] {
		return this.#store.value.events;
	}

	get(id: string): FokusEvent | undefined {
		return this.events.find((e) => e.id === id);
	}

	forDate(date: ISODate): FokusEvent[] {
		return this.events.filter((e) => e.date === date).sort(byTime);
	}

	/** Grouped by day and sorted, for the list view. */
	grouped(from?: ISODate, to?: ISODate): { date: ISODate; events: FokusEvent[] }[] {
		const groups = new Map<ISODate, FokusEvent[]>();
		for (const event of this.events) {
			if (from && event.date < from) continue;
			if (to && event.date > to) continue;
			const day = groups.get(event.date) ?? [];
			day.push(event);
			groups.set(event.date, day);
		}
		return [...groups.entries()]
			.sort(([a], [b]) => (a < b ? -1 : 1))
			.map(([date, events]) => ({ date, events: events.sort(byTime) }));
	}

	get todayCount(): number {
		return this.events.filter((e) => e.date === todayISO()).length;
	}

	add(input: {
		title: string;
		date: ISODate;
		start?: string | null;
		end?: string | null;
		location?: string;
		color?: string;
	}): FokusEvent | null {
		const title = input.title.trim();
		if (!title) return null;

		const event: FokusEvent = {
			id: uid(),
			title,
			date: input.date,
			start: input.start || null,
			// An end without a start would have nothing to be relative to.
			end: input.start ? input.end || null : null,
			location: (input.location ?? '').trim(),
			color: input.color ?? DEFAULT_EVENT_COLOR,
			createdAt: new Date().toISOString()
		};
		this.events.push(event);
		return event;
	}

	update(id: string, patch: Partial<Omit<FokusEvent, 'id'>>) {
		const event = this.get(id);
		if (!event) return;
		Object.assign(event, patch);
		if (!event.start) event.end = null;
	}

	remove(id: string) {
		const index = this.events.findIndex((e) => e.id === id);
		if (index >= 0) this.events.splice(index, 1);
	}
}

export const eventStore = new EventStore();
