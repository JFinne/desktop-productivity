import { longitudeFromTimezone } from '../themes/sun';
import { DEFAULT_THEME_ID } from '../themes/themes';

/**
 * The whole settings file, with defaults.
 *
 * New keys can be added freely: `withDefaults` in `persisted.svelte.ts` merges
 * this shape over whatever is already on disk, so an older settings.json keeps
 * the user's choices and picks up new fields at their default.
 */
export interface AppSettings {
	appearance: {
		themeId: string;
		/** When true the palette follows the daylight cycle and `themeId` is ignored. */
		adaptive: boolean;
		/** Degrees north; drives the circadian sun position. */
		latitude: number;
		/** Degrees east. */
		longitude: number;
		/** Let the circadian theme go light while the sun is high. */
		daylight: boolean;
		fontScale: number;
		showSidebarLabels: boolean;
	};
	pomodoro: {
		focusMinutes: number;
		shortBreakMinutes: number;
		longBreakMinutes: number;
		roundsBeforeLongBreak: number;
		autoStartBreaks: boolean;
		autoStartFocus: boolean;
		soundId: string;
		volume: number;
		tickSound: boolean;
		notify: boolean;
	};
	tasks: {
		showCompleted: boolean;
		carryOverUnfinished: boolean;
	};
	calendar: {
		weekStartsOn: 'sunday' | 'monday';
		defaultView: 'month' | 'week';
	};
}

export const DEFAULT_SETTINGS: AppSettings = {
	appearance: {
		themeId: DEFAULT_THEME_ID,
		adaptive: false,
		// A first guess only: longitude follows from the machine's UTC offset,
		// latitude cannot be inferred offline, so it needs a nudge from the user.
		latitude: 40,
		longitude: longitudeFromTimezone(),
		daylight: false,
		fontScale: 1,
		showSidebarLabels: true
	},
	pomodoro: {
		focusMinutes: 25,
		shortBreakMinutes: 5,
		longBreakMinutes: 15,
		roundsBeforeLongBreak: 4,
		autoStartBreaks: true,
		autoStartFocus: false,
		soundId: 'chime',
		volume: 0.6,
		tickSound: false,
		notify: true
	},
	tasks: {
		showCompleted: true,
		carryOverUnfinished: true
	},
	calendar: {
		weekStartsOn: 'monday',
		defaultView: 'month'
	}
};
