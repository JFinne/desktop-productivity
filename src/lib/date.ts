/**
 * Dates are handled as local `YYYY-MM-DD` strings, never as `Date` objects in
 * storage. `toISOString()` is deliberately avoided: it converts to UTC, which
 * lands on the wrong day for anyone west of Greenwich in the evening.
 *
 * The string form also sorts correctly with plain `<`, which is why comparisons
 * throughout the app are lexicographic.
 */

export type ISODate = string;

export function toISODate(date: Date): ISODate {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export const todayISO = (): ISODate => toISODate(new Date());

/** Local midnight on the given day. */
export function fromISODate(iso: ISODate): Date {
	const [year, month, day] = iso.split('-').map(Number);
	return new Date(year, month - 1, day);
}

export function addDays(iso: ISODate, days: number): ISODate {
	const date = fromISODate(iso);
	date.setDate(date.getDate() + days);
	return toISODate(date);
}

export function daysBetween(from: ISODate, to: ISODate): number {
	const ms = fromISODate(to).getTime() - fromISODate(from).getTime();
	return Math.round(ms / 86_400_000);
}

const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const SHORT = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const WITH_YEAR = new Intl.DateTimeFormat(undefined, {
	weekday: 'short',
	month: 'short',
	day: 'numeric',
	year: 'numeric'
});

/** "Today", "Tomorrow", "Friday", or a dated label for anything further out. */
export function formatDayLabel(iso: ISODate, from: ISODate = todayISO()): string {
	const offset = daysBetween(from, iso);
	if (offset === 0) return 'Today';
	if (offset === 1) return 'Tomorrow';
	if (offset === -1) return 'Yesterday';

	const date = fromISODate(iso);
	if (offset > 1 && offset < 7) return WEEKDAY.format(date);
	if (date.getFullYear() === fromISODate(from).getFullYear()) return SHORT.format(date);
	return WITH_YEAR.format(date);
}

export type WeekStart = 'sunday' | 'monday';

export function startOfMonth(iso: ISODate): ISODate {
	const date = fromISODate(iso);
	return toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

/** Clamps to the last day of the target month, so 31 Jan + 1 month is 28/29 Feb. */
export function addMonths(iso: ISODate, months: number): ISODate {
	const date = fromISODate(iso);
	const dayOfMonth = date.getDate();
	date.setDate(1);
	date.setMonth(date.getMonth() + months);
	const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	date.setDate(Math.min(dayOfMonth, lastDay));
	return toISODate(date);
}

export function startOfWeek(iso: ISODate, weekStartsOn: WeekStart): ISODate {
	const first = weekStartsOn === 'monday' ? 1 : 0;
	const offset = (fromISODate(iso).getDay() - first + 7) % 7;
	return addDays(iso, -offset);
}

export const isSameMonth = (a: ISODate, b: ISODate) => a.slice(0, 7) === b.slice(0, 7);

export function weekDates(iso: ISODate, weekStartsOn: WeekStart): ISODate[] {
	const start = startOfWeek(iso, weekStartsOn);
	return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Six weeks covering the month. Always six rows so the grid does not change
 * height as you page through months.
 */
export function monthMatrix(iso: ISODate, weekStartsOn: WeekStart): ISODate[][] {
	const start = startOfWeek(startOfMonth(iso), weekStartsOn);
	return Array.from({ length: 6 }, (_, week) =>
		Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day))
	);
}

const WEEKDAY_SHORT = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const MONTH_YEAR = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const DAY_FULL = new Intl.DateTimeFormat(undefined, {
	weekday: 'long',
	month: 'long',
	day: 'numeric'
});

export function weekdayLabels(weekStartsOn: WeekStart): string[] {
	// 2024-01-07 was a Sunday, which makes the rotation easy to reason about.
	const sunday = new Date(2024, 0, 7);
	return Array.from({ length: 7 }, (_, i) => {
		const date = new Date(sunday);
		date.setDate(sunday.getDate() + i + (weekStartsOn === 'monday' ? 1 : 0));
		return WEEKDAY_SHORT.format(date);
	});
}

export const monthLabel = (iso: ISODate) => MONTH_YEAR.format(fromISODate(iso));

export const dayOfMonth = (iso: ISODate) => fromISODate(iso).getDate();

export const fullDayLabel = (iso: ISODate) => DAY_FULL.format(fromISODate(iso));

export function weekLabel(iso: ISODate, weekStartsOn: WeekStart): string {
	const dates = weekDates(iso, weekStartsOn);
	const first = dates[0];
	const last = dates[6];
	return isSameMonth(first, last)
		? monthLabel(first)
		: `${monthLabel(first)} – ${monthLabel(last)}`;
}
