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
